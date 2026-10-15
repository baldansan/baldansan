"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ReportRow = {
  id: string;
  message_id: number | null;
  room_id: string | null;
  reported_user_id: string | null;
  message_body: string | null;
  reporter_id: string;
  reason: string;
  status: "open" | "resolved";
  created_at: string;
};

type NameMap = Record<string, { name: string; banned: boolean }>;

export function AdminChatView() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [names, setNames] = useState<NameMap>({});
  const [rooms, setRooms] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"open" | "resolved">("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setError("Supabase тохиргоо дутуу байна.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("chat_reports")
      .select("id, message_id, room_id, reported_user_id, message_body, reporter_id, reason, status, created_at")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(200);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as ReportRow[];
    setRows(list);

    const userIds = Array.from(
      new Set(list.flatMap((r) => [r.reporter_id, r.reported_user_id]).filter(Boolean) as string[])
    );
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("chat_profiles")
        .select("user_id, display_name, chat_banned")
        .in("user_id", userIds);
      const map: NameMap = {};
      for (const p of (profiles ?? []) as { user_id: string; display_name: string; chat_banned: boolean }[]) {
        map[p.user_id] = { name: p.display_name, banned: p.chat_banned };
      }
      setNames(map);
    }
    const roomIds = Array.from(new Set(list.map((r) => r.room_id).filter(Boolean) as string[]));
    if (roomIds.length > 0) {
      const { data: rs } = await supabase
        .from("chat_room_directory")
        .select("id, title, kind")
        .in("id", roomIds);
      const rmap: Record<string, string> = {};
      for (const r of (rs ?? []) as { id: string; title: string; kind: string }[]) {
        rmap[r.id] = r.title || r.kind;
      }
      setRooms(rmap);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function deleteMessage(row: ReportRow) {
    if (!supabase || row.message_id === null) return;
    const { error: err } = await supabase.from("chat_messages").delete().eq("id", row.message_id);
    if (err) {
      setError(err.message);
      return;
    }
    await supabase.from("chat_reports").update({ status: "resolved" }).eq("id", row.id);
    void load();
  }

  async function setBan(userId: string, banned: boolean) {
    if (!supabase) return;
    const { error: err } = await supabase.rpc("chat_admin_set_ban", {
      p_user: userId,
      p_banned: banned,
    });
    if (err) setError(err.message);
    else void load();
  }

  async function resolve(row: ReportRow) {
    if (!supabase) return;
    const { error: err } = await supabase
      .from("chat_reports")
      .update({ status: "resolved" })
      .eq("id", row.id);
    if (err) setError(err.message);
    else void load();
  }

  const who = (id: string | null) => (id ? (names[id]?.name || id.slice(0, 8)) : "—");

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Чатын мэдээлэл</h1>
        <p className="mt-1 text-sm text-slate-600">
          Хэрэглэгчдийн мэдээлсэн мессежүүд. Устгах эсвэл хэрэглэгчийг чатаас түгжих боломжтой.
        </p>
      </section>

      <div className="flex gap-2">
        {(["open", "resolved"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              status === s
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {s === "open" ? "Шинэ" : "Шийдсэн"}
          </button>
        ))}
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Ачааллаж байна…</p> : null}
      {!loading && rows.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Мэдээлэл алга.
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const banned = r.reported_user_id ? names[r.reported_user_id]?.banned : false;
          return (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm text-slate-900">
                {r.message_body ?? "(устсан мессеж)"}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                <dt>Бичсэн</dt>
                <dd className="font-semibold">{who(r.reported_user_id)}</dd>
                <dt>Мэдээлсэн</dt>
                <dd className="font-semibold">{who(r.reporter_id)}</dd>
                <dt>Өрөө</dt>
                <dd className="font-semibold">{r.room_id ? (rooms[r.room_id] ?? r.room_id.slice(0, 8)) : "—"}</dd>
                <dt>Огноо</dt>
                <dd>{new Date(r.created_at).toLocaleString("mn-MN")}</dd>
                {r.reason ? (
                  <>
                    <dt>Шалтгаан</dt>
                    <dd>{r.reason}</dd>
                  </>
                ) : null}
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.message_id !== null ? (
                  <button
                    type="button"
                    onClick={() => void deleteMessage(r)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Устгах
                  </button>
                ) : null}
                {r.reported_user_id ? (
                  <button
                    type="button"
                    onClick={() => void setBan(r.reported_user_id as string, !banned)}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    {banned ? "Түгжээ тайлах" : "Хэрэглэгчийг түгжих"}
                  </button>
                ) : null}
                {r.status === "open" ? (
                  <button
                    type="button"
                    onClick={() => void resolve(r)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Шийдсэн гэж тэмдэглэх
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
