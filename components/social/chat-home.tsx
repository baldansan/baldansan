"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { ts } from "@/lib/social/i18n";
import {
  createTeamRoom,
  createTopicRoom,
  getMyTopicRoom,
  joinRoom,
  listAgeRooms,
  listMembersForRooms,
  listMyRooms,
  listOpenTopicRooms,
  listTeamRooms,
} from "@/lib/social/rooms";
import { getOwnProfile, saveOwnProfile } from "@/lib/social/profile";
import {
  AGE_BANDS,
  TEAM_MAX_MEMBERS,
  type AgeBand,
  type ChatMember,
  type ChatRoom,
  type OwnProfile,
} from "@/lib/social/types";
import { SocialAvatar } from "./avatar";
import { ChatGate } from "./chat-gate";

type TabKey = "mine" | "open" | "teams" | "age";

export function ChatHome() {
  return <ChatGate>{(userId) => <ChatHomeInner userId={userId} />}</ChatGate>;
}

function ChatHomeInner({ userId }: { userId: string }) {
  const locale = useUiLocale();
  const router = useRouter();
  const t = useCallback((s: string) => ts(locale, s), [locale]);

  const [tab, setTab] = useState<TabKey>("mine");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<ChatRoom[]>([]);
  const [open, setOpen] = useState<ChatRoom[]>([]);
  const [teams, setTeams] = useState<ChatRoom[]>([]);
  const [ageRooms, setAgeRooms] = useState<ChatRoom[]>([]);
  const [dmMembers, setDmMembers] = useState<ChatMember[]>([]);
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [m, o, tm, a, p] = await Promise.all([
      listMyRooms(),
      listOpenTopicRooms(),
      listTeamRooms(),
      listAgeRooms(),
      getOwnProfile(userId),
    ]);
    const firstError = m.error ?? o.error ?? tm.error ?? a.error;
    if (firstError) setError(firstError);
    const myRooms = m.data ?? [];
    setMine(myRooms);
    setOpen(o.data ?? []);
    setTeams(tm.data ?? []);
    setAgeRooms(a.data ?? []);
    setProfile(p.data);
    const dmIds = myRooms.filter((r) => r.kind === "dm").map((r) => r.id);
    if (dmIds.length > 0) {
      const members = await listMembersForRooms(dmIds);
      setDmMembers(members.data ?? []);
    } else {
      setDmMembers([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const roomTitle = useCallback(
    (room: ChatRoom): string => {
      if (room.kind === "dm") {
        const other = dmMembers.find((m) => m.room_id === room.id && m.user_id !== userId);
        return other?.display_name || t("Мессеж бичих");
      }
      if (room.kind === "class") return room.title || t("Ангийн чат");
      return room.title;
    },
    [dmMembers, userId, t]
  );

  async function handleJoin(room: ChatRoom) {
    setBusyId(room.id);
    setError(null);
    const res = await joinRoom(room.id, userId);
    setBusyId(null);
    if (res.error) {
      setError(res.error);
      void load();
      return;
    }
    router.push(`/chat/${room.id}`);
  }

  async function handleSetAgeBand(band: AgeBand) {
    const res = await saveOwnProfile(userId, {
      display_name: profile?.display_name ?? "",
      avatar: profile?.avatar ?? null,
      instagram: profile?.instagram ?? null,
      is_public: profile?.is_public ?? false,
      age_band: band,
      bio: profile?.bio ?? null,
    });
    if (res.error) setError(res.error);
    else setProfile(res.data);
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "mine", label: t("Миний өрөөнүүд") },
    { key: "open", label: t("Нээлттэй өрөөнүүд") },
    { key: "teams", label: t("Багууд") },
    { key: "age", label: t("Хятадаар ярилцъя") },
  ];

  const mineSorted = useMemo(
    () =>
      mine
        .slice()
        .sort((a, b) => (a.kind === "class" ? -1 : 0) - (b.kind === "class" ? -1 : 0)),
    [mine]
  );

  return (
    <MobileAppShell activeTab="profile" desktopWidth="narrow">
      <div className="pb-24">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-[var(--app-text)]">
            💬 {t("Чат")}
          </h1>
          <Link
            href="/profile#chat-profile"
            className="text-xs font-semibold text-emerald-700"
          >
            {t("Профайлаа тохируулах")}
          </Link>
        </div>

        <div
          className="app-chip-scroll mb-4 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
        >
          {tabs.map((x) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={tab === x.key}
              onClick={() => setTab(x.key)}
              className={`app-chip ${tab === x.key ? "app-chip-active" : ""}`}
            >
              {x.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <p className="py-10 text-center text-sm text-[var(--app-muted)]">
            {t("Ачааллаж байна…")}
          </p>
        ) : null}

        {!loading && tab === "mine" ? (
          <RoomList
            rooms={mineSorted}
            empty="Та одоогоор ямар ч өрөөнд ороогүй байна. «Нээлттэй өрөөнүүд» хэсгээс нэгдээрэй."
            render={(room) => (
              <RoomCard
                key={room.id}
                room={room}
                title={roomTitle(room)}
                badge={
                  room.kind === "class"
                    ? t("Ангийн чат")
                    : room.kind === "team"
                      ? t("Баг")
                      : room.kind === "dm"
                        ? "1:1"
                        : room.kind === "age"
                          ? t("Хятадаар ярилцъя")
                          : t("Сэдвийн өрөө")
                }
                action={
                  <Link href={`/chat/${room.id}`} className="app-btn-secondary !min-h-[36px] !px-4 !py-1.5 !text-xs">
                    {t("Нээх")}
                  </Link>
                }
              />
            )}
          />
        ) : null}

        {!loading && tab === "open" ? (
          <RoomList
            rooms={open}
            empty="Нээлттэй өрөө алга. Эхний өрөөг та нээгээрэй!"
            render={(room) => (
              <RoomCard
                key={room.id}
                room={room}
                title={room.title}
                badge={room.topic ?? undefined}
                action={
                  room.is_member ? (
                    <Link href={`/chat/${room.id}`} className="app-btn-secondary !min-h-[36px] !px-4 !py-1.5 !text-xs">
                      {t("Нээх")}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === room.id}
                      onClick={() => void handleJoin(room)}
                      className="app-btn-primary !min-h-[36px] !px-4 !py-1.5 !text-xs disabled:opacity-60"
                    >
                      {t("Нэгдэх")}
                    </button>
                  )
                }
              />
            )}
          />
        ) : null}

        {!loading && tab === "teams" ? (
          <RoomList
            rooms={teams}
            empty="Баг алга. 5 хүртэлх хүнтэй баг нээгээрэй!"
            render={(room) => {
              const max = room.max_members ?? TEAM_MAX_MEMBERS;
              const full = room.member_count >= max;
              return (
                <RoomCard
                  key={room.id}
                  room={room}
                  title={room.title}
                  badge={`${room.member_count}/${max}`}
                  action={
                    room.is_member ? (
                      <Link href={`/chat/${room.id}`} className="app-btn-secondary !min-h-[36px] !px-4 !py-1.5 !text-xs">
                        {t("Нээх")}
                      </Link>
                    ) : full ? (
                      <span className="text-xs font-semibold text-[var(--app-muted)]">
                        {t("Дүүрсэн")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === room.id}
                        onClick={() => void handleJoin(room)}
                        className="app-btn-primary !min-h-[36px] !px-4 !py-1.5 !text-xs disabled:opacity-60"
                      >
                        {t("Нэгдэх")} · {max - room.member_count} {t("Сул")}
                      </button>
                    )
                  }
                />
              );
            }}
          />
        ) : null}

        {!loading && tab === "age" ? (
          <div className="flex flex-col gap-3">
            {!profile?.age_band ? (
              <div className="app-card p-4">
                <p className="text-sm font-bold text-[var(--app-text)]">{t("Нас сонгох")}</p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {t("Насны хүрээгээ сонгосны дараа энэ өрөөнд нэгдэж болно.")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {AGE_BANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => void handleSetAgeBand(b)}
                      className="app-chip"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {ageRooms.map((room) => {
              const mismatch = profile?.age_band && room.age_band !== profile.age_band;
              return (
                <RoomCard
                  key={room.id}
                  room={room}
                  title={room.title}
                  badge={room.age_band ?? undefined}
                  action={
                    room.is_member ? (
                      <Link href={`/chat/${room.id}`} className="app-btn-secondary !min-h-[36px] !px-4 !py-1.5 !text-xs">
                        {t("Нээх")}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={!profile?.age_band || Boolean(mismatch) || busyId === room.id}
                        onClick={() => void handleJoin(room)}
                        className="app-btn-primary !min-h-[36px] !px-4 !py-1.5 !text-xs disabled:opacity-40"
                      >
                        {t("Нэгдэх")}
                      </button>
                    )
                  }
                />
              );
            })}
            {profile?.age_band ? (
              <p className="text-center text-xs text-[var(--app-muted)]">
                {t("Нас")}: {profile.age_band} ·{" "}
                <Link href="/profile#chat-profile" className="font-semibold text-emerald-700">
                  {t("Профайлаа тохируулах")}
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setCreating(true)}
        className="app-btn-primary fixed bottom-24 right-4 z-30 !min-h-[48px] shadow-lg"
      >
        ＋ {t("Өрөө нээх")}
      </button>

      {creating ? (
        <CreateRoomSheet
          userId={userId}
          initialKind={tab === "teams" ? "team" : "topic"}
          onClose={() => setCreating(false)}
          onCreated={(id) => router.push(`/chat/${id}`)}
        />
      ) : null}
    </MobileAppShell>
  );
}

function RoomList({
  rooms,
  empty,
  render,
}: {
  rooms: ChatRoom[];
  empty: string;
  render: (room: ChatRoom) => React.ReactNode;
}) {
  if (rooms.length === 0) {
    return (
      <p className="app-card p-5 text-center text-sm text-[var(--app-muted)]">{empty}</p>
    );
  }
  return <div className="flex flex-col gap-3">{rooms.map(render)}</div>;
}

function RoomCard({
  room,
  title,
  badge,
  action,
}: {
  room: ChatRoom;
  title: string;
  badge?: string;
  action: React.ReactNode;
}) {
  const locale = useUiLocale();
  return (
    <div className="app-card flex items-center gap-3 p-3">
      <SocialAvatar name={title} avatar={room.kind === "age" ? "🗣️" : room.owner_avatar} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[var(--app-text)]">{title || "—"}</p>
        <p className="truncate text-xs text-[var(--app-muted)]">
          {badge ? `${badge} · ` : ""}
          {room.member_count} {ts(locale, "гишүүн")}
          {room.owner_name ? ` · ${ts(locale, "Эзэн")}: ${room.owner_name}` : ""}
        </p>
        {room.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-[var(--app-muted)]">{room.description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function CreateRoomSheet({
  userId,
  initialKind,
  onClose,
  onCreated,
}: {
  userId: string;
  initialKind: "topic" | "team";
  onClose: () => void;
  onCreated: (roomId: string) => void;
}) {
  const locale = useUiLocale();
  const t = (s: string) => ts(locale, s);
  const [kind, setKind] = useState<"topic" | "team">(initialKind);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [existing, setExisting] = useState<ChatRoom | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void getMyTopicRoom(userId).then((res) => {
      if (alive) setExisting(res.data);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const blocked = kind === "topic" && existing !== null;

  async function submit() {
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    const input = { title, topic, description };
    const res =
      kind === "topic" ? await createTopicRoom(userId, input) : await createTeamRoom(userId, input);
    setBusy(false);
    if (res.error || !res.data) {
      setError(res.error ?? "Алдаа гарлаа");
      return;
    }
    onCreated(res.data.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[480px] rounded-t-3xl bg-white p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-3 flex gap-2">
          {(["topic", "team"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`app-chip ${kind === k ? "app-chip-active" : ""}`}
            >
              {k === "topic" ? t("Сэдвийн өрөө") : `${t("Баг нээх")} (≤${TEAM_MAX_MEMBERS})`}
            </button>
          ))}
        </div>

        {blocked && existing ? (
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">{t("Та 1 өрөө л нээж болно")}</p>
            <p className="mt-1 text-xs">
              {t("Та аль хэдийн сэдвийн өрөө нээсэн байна. Нэг хүн зөвхөн 1 өрөө нээнэ.")}
            </p>
            <Link
              href={`/chat/${existing.id}`}
              className="mt-3 inline-flex app-btn-primary !min-h-[40px]"
            >
              {t("Өөрийн өрөөг нээх")}: {existing.title}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder={t("Өрөөний нэр")}
              className="min-h-[44px] rounded-xl border border-[var(--app-border)] px-3 text-sm"
            />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={80}
              placeholder={t("Сэдэв")}
              className="min-h-[44px] rounded-xl border border-[var(--app-border)] px-3 text-sm"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t("Тайлбар")}
              className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm"
            />
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={busy || !title.trim()}
              onClick={() => void submit()}
              className="app-btn-primary w-full disabled:opacity-50"
            >
              {t("Үүсгэх")}
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-sm font-semibold text-[var(--app-muted)]"
        >
          {t("Болих")}
        </button>
      </div>
    </div>
  );
}
