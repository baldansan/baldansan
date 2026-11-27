"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { openDirectMessage } from "@/lib/social/rooms";

type Learner = {
  userId: string;
  name: string;
  email: string | null;
  lastActiveAt: string | null;
  daysInactive: number | null;
  push: boolean;
};
type ClassRow = { id: string; name: string; userIds: string[] };
type Mode = "all" | "inactive" | "classroom" | "users";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "all", label: "Бүх хэрэглэгч", hint: "Мэдэгдэл асаасан бүх хүн." },
  { id: "inactive", label: "Ороогүй хоногоор", hint: "Сонгосон хоногоос удаан ороогүй хүмүүс." },
  { id: "classroom", label: "Ангиар", hint: "Нэг ангийн сурагчид (HSK түвшний ангиуд орно)." },
  { id: "users", label: "Нэрээр сонгох", hint: "Жагсаалтаас хайж нэг эсвэл хэдэн хүн сонгоно." },
];

/** Бэлэн үгс — Балдангийн өнгөөр. Дарахад бичвэрт орно, засаж болно. */
const TEMPLATES: { title: string; body: string }[] = [
  { title: "Тэмээ багш", body: "Би эндээ л байна. Таван минут байхад болно." },
  { title: "Шинэ хичээл орлоо", body: "Шинэ хичээл нэмэгдсэн. Ороод нэг хар." },
  { title: "Тэмээ багш", body: "Өнөөдөр гурван үг. Тэгээд л боллоо." },
];

function inactiveLabel(days: number | null): string {
  if (days == null) return "идэвх бүртгэгдээгүй";
  if (days === 0) return "өнөөдөр орсон";
  return `${days} хоног ороогүй`;
}

export function AdminMessagesView() {
  const router = useRouter();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("inactive");
  const [days, setDays] = useState(7);
  const [classroomId, setClassroomId] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const [title, setTitle] = useState("Тэмээ багш");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [chatBusy, setChatBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch("/api/admin/messages", { cache: "no-store" });
        const data = (await res.json()) as { ok: boolean; learners?: Learner[]; classes?: ClassRow[]; error?: string };
        if (!alive) return;
        if (!data.ok) setError(data.error ?? "Жагсаалт ачаалж чадсангүй.");
        else {
          setLearners(data.learners ?? []);
          setClasses(data.classes ?? []);
          setClassroomId((data.classes ?? [])[0]?.id ?? "");
        }
      } catch {
        if (alive) setError("Жагсаалт ачаалж чадсангүй.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const targets = useMemo(() => {
    if (mode === "all") return learners;
    if (mode === "inactive") return learners.filter((l) => l.daysInactive == null || l.daysInactive >= days);
    if (mode === "classroom") {
      const ids = new Set(classes.find((c) => c.id === classroomId)?.userIds ?? []);
      return learners.filter((l) => ids.has(l.userId));
    }
    return learners.filter((l) => picked.has(l.userId));
  }, [mode, learners, days, classes, classroomId, picked]);
  const reachable = targets.filter((l) => l.push).length;

  const searchRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? learners.filter((l) => l.name.toLowerCase().includes(q) || (l.email ?? "").toLowerCase().includes(q))
      : learners;
    return [...rows]
      .sort((a, b) => Number(picked.has(b.userId)) - Number(picked.has(a.userId)) || a.name.localeCompare(b.name))
      .slice(0, 60);
  }, [learners, query, picked]);

  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function openChat(userId: string) {
    setChatBusy(userId);
    const res = await openDirectMessage(userId);
    setChatBusy(null);
    if (res.error || !res.data) {
      setError(res.error ?? "Чат нээж чадсангүй. (Чатын профайлаа эхлээд үүсгэсэн байх хэрэгтэй.)");
      return;
    }
    router.push(`/chat/${res.data}`);
  }

  async function send() {
    setSending(true);
    setResult(null);
    setError(null);
    const audience =
      mode === "all"
        ? { type: "all" }
        : mode === "inactive"
          ? { type: "inactive", days }
          : mode === "classroom"
            ? { type: "classroom", classroomId }
            : { type: "users", userIds: [...picked] };
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, title, body }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        selected?: number;
        withPush?: number;
        reached?: number;
        pushConfigured?: boolean;
        error?: string;
      };
      if (!data.ok) setError(data.error ?? "Илгээж чадсангүй.");
      else if (data.pushConfigured === false) setError("Мэдэгдлийн тохиргоо (VAPID) серверт алга байна.");
      else
        setResult(
          `Илгээлээ: сонгосон ${data.selected} хүнээс ${data.withPush} нь мэдэгдэл асаасан, ${data.reached} хүний төхөөрөмжид хүрлээ.`
        );
    } catch {
      setError("Илгээж чадсангүй.");
    } finally {
      setSending(false);
      setConfirm(false);
    }
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && reachable > 0 && !sending;
  const card = "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5";
  const input =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500";

  if (loading) return <p className="text-sm text-slate-500">Ачааллаж байна…</p>;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className={card}>
        <h2 className="text-base font-bold text-slate-900">1. Хэнд явуулах вэ</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                mode === m.id ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">{MODES.find((m) => m.id === mode)?.hint}</p>

        {mode === "inactive" ? (
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
              className={`${input} w-24`}
            />
            хоног ба түүнээс удаан ороогүй
          </label>
        ) : null}

        {mode === "classroom" ? (
          classes.length > 0 ? (
            <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)} className={`${input} mt-3`}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.userIds.length})
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Сурагчтай анги алга.</p>
          )
        ) : null}

        {mode === "users" ? (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Нэр эсвэл имэйлээр хайх"
            className={`${input} mt-3`}
          />
        ) : null}

        <p className="mt-4 rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900">
          Сонгогдсон: {targets.length} хүн · мэдэгдэл очих боломжтой: {reachable}
        </p>

        <ul className="mt-3 max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
          {(mode === "users" ? searchRows : targets.slice(0, 60)).map((l) => (
            <li key={l.userId} className="flex items-center gap-3 py-2">
              {mode === "users" ? (
                <input
                  type="checkbox"
                  checked={picked.has(l.userId)}
                  onChange={() => togglePick(l.userId)}
                  className="h-4 w-4"
                  aria-label={`${l.name} сонгох`}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{l.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {inactiveLabel(l.daysInactive)} · {l.push ? "🔔 мэдэгдэл асаасан" : "🔕 мэдэгдэлгүй"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void openChat(l.userId)}
                disabled={chatBusy === l.userId}
                className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 disabled:opacity-50"
              >
                {chatBusy === l.userId ? "…" : "💬 Чат"}
              </button>
            </li>
          ))}
        </ul>
        {mode !== "users" && targets.length > 60 ? (
          <p className="mt-2 text-xs text-slate-500">Эхний 60-ыг харуулж байна (нийт {targets.length}).</p>
        ) : null}
      </section>

      <section className={card}>
        <h2 className="text-base font-bold text-slate-900">2. Юу гэж бичих вэ</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.body}
              type="button"
              onClick={() => {
                setTitle(t.title);
                setBody(t.body);
              }}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {t.body.length > 28 ? `${t.body.slice(0, 28)}…` : t.body}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">Гарчиг</label>
        <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} className={`${input} mt-1`} />
        <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Бичвэр ({body.length}/240)
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 240))}
          rows={4}
          placeholder="Жишээ: Энэ долоо хоногт HSK4-ийн шинэ загвар шалгалт нэмэгдлээ."
          className={`${input} mt-1`}
        />

        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">Утсан дээр ингэж харагдана</p>
        <div className="mt-1 flex items-start gap-3 rounded-2xl bg-slate-900 p-3 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- жижиг статик зураг */}
          <img src="/icons/baldan-192.png" alt="" className="h-10 w-10 rounded-lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{title || "Гарчиг"}</p>
            <p className="text-sm text-slate-200">{body || "Бичвэр энд гарна."}</p>
          </div>
        </div>

        {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {result ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{result}</p> : null}

        {confirm ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-900">
              {reachable} хүний утас руу одоо явуулах уу? Буцааж болохгүй.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => void send()}
                disabled={sending}
                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {sending ? "Илгээж байна…" : "Тийм, явуул"}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
              >
                Болих
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            disabled={!canSend}
            className="mt-4 w-full rounded-full bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {reachable} хүнд мэдэгдэл явуулах
          </button>
        )}
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Олон хоног ороогүй хүмүүст апп өөрөө орой бүр 20:00-д нэг сануулга явуулдаг (өдөр бүр өөр үгтэй). Энэ хуудас бол
          нэмэлтээр, өөрийн үгээр явуулахад зориулсан.
        </p>
      </section>
    </div>
  );
}
