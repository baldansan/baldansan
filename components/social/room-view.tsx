"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { ts } from "@/lib/social/i18n";
import {
  blockUser,
  fetchRecentMessages,
  listBlockedIds,
  reportMessage,
  sendMessage,
  subscribeToMessages,
  unblockUser,
} from "@/lib/social/messages";
import {
  getRoom,
  joinRoom,
  leaveRoom,
  listMembers,
  removeMember,
  renameRoom,
  setRoomClosed,
} from "@/lib/social/rooms";
import {
  MESSAGE_MAX_LENGTH,
  type ChatMember,
  type ChatMessage,
  type ChatRoom,
} from "@/lib/social/types";
import { SocialAvatar } from "./avatar";
import { ChatGate } from "./chat-gate";

export function RoomView({ roomId }: { roomId: string }) {
  return <ChatGate>{(userId) => <RoomViewInner roomId={roomId} userId={userId} />}</ChatGate>;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDay(iso: string, t: (s: string) => string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(iso) === dayKey(now.toISOString())) return t("Өнөөдөр");
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return t("Өчигдөр");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function RoomViewInner({ roomId, userId }: { roomId: string; userId: string }) {
  const locale = useUiLocale();
  const router = useRouter();
  const t = useCallback((s: string) => ts(locale, s), [locale]);

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [actionMsg, setActionMsg] = useState<ChatMessage | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const blockedRef = useRef(blocked);
  const membersRef = useRef(members);
  blockedRef.current = blocked;
  membersRef.current = members;

  const isMember = room?.is_member ?? false;
  const isOwner = room?.owner_user_id === userId;
  const canRename = isOwner && room?.kind !== "age" && room?.kind !== "dm";

  const nameOf = useCallback(
    (uid: string) => {
      const m = members.find((x) => x.user_id === uid);
      return { name: m?.display_name || "—", avatar: m?.avatar ?? null };
    },
    [members]
  );

  const title = useMemo(() => {
    if (!room) return "";
    if (room.kind === "dm") {
      const other = members.find((m) => m.user_id !== userId);
      return other?.display_name || t("Мессеж бичих");
    }
    if (room.kind === "class") return room.title || t("Ангийн чат");
    return room.title;
  }, [room, members, userId, t]);

  const refreshMembers = useCallback(async () => {
    const res = await listMembers(roomId);
    if (res.data) setMembers(res.data);
  }, [roomId]);

  // Анхны ачаалал
  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | null = null;

    async function init() {
      const roomRes = await getRoom(roomId);
      if (!alive) return;
      setRoom(roomRes.data);
      setRoomLoaded(true);
      if (roomRes.error) setError(roomRes.error);
      if (!roomRes.data?.is_member) return;

      const [blockedRes, membersRes] = await Promise.all([listBlockedIds(), listMembers(roomId)]);
      if (!alive) return;
      const blockedSet = new Set(blockedRes.data ?? []);
      setBlocked(blockedSet);
      blockedRef.current = blockedSet;
      setMembers(membersRes.data ?? []);

      // Эхлээд subscribe, дараа нь татна — завсар алдагдахгүй (id-аар давхардал арилгана)
      unsubscribe = subscribeToMessages(roomId, {
        onInsert: (msg) => {
          if (blockedRef.current.has(msg.user_id)) return;
          if (!membersRef.current.some((m) => m.user_id === msg.user_id)) {
            void refreshMembers();
          }
          setMessages((prev) =>
            prev.some((p) => p.id === msg.id) ? prev : [...prev, msg].sort((a, b) => a.id - b.id)
          );
        },
        onDelete: (id) => setMessages((prev) => prev.filter((m) => m.id !== id)),
      });

      const msgRes = await fetchRecentMessages(roomId, 50);
      if (!alive) return;
      if (msgRes.error) setError(msgRes.error);
      const rows = msgRes.data ?? [];
      setHasMore(rows.length >= 50);
      setMessages((prev) => {
        const map = new Map<number, ChatMessage>();
        for (const m of [...rows, ...prev]) map.set(m.id, m);
        return Array.from(map.values())
          .filter((m) => !blockedSet.has(m.user_id))
          .sort((a, b) => a.id - b.id);
      });
    }
    void init();
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [roomId, refreshMembers]);

  // Автомат доош гүйлгэх
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function loadOlder() {
    const first = messages[0];
    if (!first) return;
    stickRef.current = false;
    const res = await fetchRecentMessages(roomId, 50, first.id);
    const rows = res.data ?? [];
    setHasMore(rows.length >= 50);
    setMessages((prev) => {
      const map = new Map<number, ChatMessage>();
      for (const m of [...rows, ...prev]) map.set(m.id, m);
      return Array.from(map.values())
        .filter((m) => !blockedRef.current.has(m.user_id))
        .sort((a, b) => a.id - b.id);
    });
  }

  async function handleSend() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const res = await sendMessage(roomId, userId, body);
    setSending(false);
    if (res.error || !res.data) {
      setError(res.error);
      return;
    }
    const sent = res.data;
    setDraft("");
    stickRef.current = true;
    setMessages((prev) => (prev.some((p) => p.id === sent.id) ? prev : [...prev, sent]));
  }

  async function handleJoin() {
    const res = await joinRoom(roomId, userId);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
    window.location.reload();
  }

  async function handleLeave() {
    const res = await leaveRoom(roomId, userId);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/chat");
  }

  async function handleReport(msg: ChatMessage) {
    setActionMsg(null);
    const res = await reportMessage(msg.id, "");
    if (res.error) setError(res.error);
    else setNotice(t("Мэдээлэл илгээлээ"));
  }

  async function handleBlock(targetId: string) {
    setActionMsg(null);
    const res = await blockUser(userId, targetId);
    if (res.error) {
      setError(res.error);
      return;
    }
    setBlocked((prev) => new Set(prev).add(targetId));
    setMessages((prev) => prev.filter((m) => m.user_id !== targetId));
    setNotice(t("Хориглосон"));
  }

  async function handleUnblock(targetId: string) {
    const res = await unblockUser(userId, targetId);
    if (res.error) {
      setError(res.error);
      return;
    }
    setBlocked((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
    const msgRes = await fetchRecentMessages(roomId, 50);
    if (msgRes.data) setMessages(msgRes.data);
  }

  async function handleRename() {
    const next = window.prompt(t("Өрөөний нэр"), room?.title ?? "");
    if (!next || !next.trim()) return;
    const res = await renameRoom(roomId, next);
    if (res.error) setError(res.error);
    else setRoom((r) => (r ? { ...r, title: next.trim().slice(0, 80) } : r));
  }

  async function handleToggleClosed() {
    if (!room) return;
    const next = !room.is_closed;
    const res = await setRoomClosed(roomId, next);
    if (res.error) setError(res.error);
    else setRoom({ ...room, is_closed: next });
  }

  async function handleRemoveMember(uid: string) {
    const res = await removeMember(roomId, uid);
    if (res.error) setError(res.error);
    else setMembers((prev) => prev.filter((m) => m.user_id !== uid));
  }

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(id);
  }, [notice]);

  // Урт дарлт (500ms)
  const pressTimer = useRef<number | null>(null);
  function startPress(msg: ChatMessage) {
    if (msg.user_id === userId) return;
    pressTimer.current = window.setTimeout(() => setActionMsg(msg), 500);
  }
  function cancelPress() {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  }

  if (!roomLoaded) {
    return (
      <MobileAppShell activeTab="profile" showBottomNav={false}>
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">{t("Ачааллаж байна…")}</p>
      </MobileAppShell>
    );
  }

  if (!room) {
    return (
      <MobileAppShell activeTab="profile" showBottomNav={false}>
        <div className="app-card p-5 text-center">
          <p className="text-sm text-[var(--app-muted)]">{t("Өрөө олдсонгүй")}</p>
          <Link href="/chat" className="mt-3 inline-flex app-btn-primary">
            {t("Чат")}
          </Link>
        </div>
      </MobileAppShell>
    );
  }

  const closed = room.is_closed;
  const sortedMembers = members
    .slice()
    .sort((a, b) => (a.role === b.role ? 0 : a.role === "owner" ? -1 : 1));

  return (
    <MobileAppShell activeTab="profile" showBottomNav={false}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Link href="/chat" aria-label={t("Чат")} className="p-2 text-lg text-[var(--app-muted)]">
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold text-[var(--app-text)]">{title}</h1>
            <p className="truncate text-xs text-[var(--app-muted)]">
              {room.member_count}
              {room.max_members ? `/${room.max_members}` : ""} {t("гишүүн")}
              {room.topic ? ` · ${room.topic}` : ""}
              {closed ? ` · ${t("Өрөө хаагдсан")}` : ""}
            </p>
          </div>
          {isMember ? (
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="app-chip"
              aria-label={t("Гишүүд")}
            >
              👥 {t("Гишүүд")}
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}
        {notice ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{notice}</p>
        ) : null}

        {!isMember ? (
          <div className="app-card p-5 text-center">
            <p className="text-sm text-[var(--app-muted)]">
              {room.description || t("Зөвхөн гишүүд харна")}
            </p>
            {room.is_open && !closed ? (
              <button
                type="button"
                onClick={() => void handleJoin()}
                className="mt-4 app-btn-primary w-full"
              >
                {t("Нэгдэх")}
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div
              ref={listRef}
              onScroll={onScroll}
              className="app-card flex h-[calc(100dvh-300px)] min-h-[280px] flex-col gap-1 overflow-y-auto p-3"
            >
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => void loadOlder()}
                  className="mx-auto mb-2 text-xs font-semibold text-emerald-700"
                >
                  ↑
                </button>
              ) : null}
              {messages.length === 0 ? (
                <p className="my-auto text-center text-sm text-[var(--app-muted)]">
                  {t("Мессеж алга. Эхний мессежийг та бичээрэй!")}
                </p>
              ) : null}
              {messages.map((msg, i) => {
                const mine = msg.user_id === userId;
                const prev = messages[i - 1];
                const newDay = !prev || dayKey(prev.created_at) !== dayKey(msg.created_at);
                const showName = !mine && (newDay || prev?.user_id !== msg.user_id);
                const who = nameOf(msg.user_id);
                return (
                  <div key={msg.id}>
                    {newDay ? (
                      <div className="my-2 text-center text-[11px] font-semibold text-[var(--app-muted)]">
                        {formatDay(msg.created_at, t)}
                      </div>
                    ) : null}
                    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                      {!mine ? (
                        showName ? (
                          <Link href={`/u/${msg.user_id}`} aria-label={who.name}>
                            <SocialAvatar name={who.name} avatar={who.avatar} size={30} />
                          </Link>
                        ) : (
                          <span className="w-[30px] shrink-0" />
                        )
                      ) : null}
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? "rounded-br-md bg-[var(--app-primary)] text-white"
                            : "rounded-bl-md bg-slate-100 text-[var(--app-text)]"
                        }`}
                        onTouchStart={() => startPress(msg)}
                        onTouchEnd={cancelPress}
                        onTouchMove={cancelPress}
                        onContextMenu={(e) => {
                          if (!mine) {
                            e.preventDefault();
                            setActionMsg(msg);
                          }
                        }}
                      >
                        {showName ? (
                          <p className="mb-0.5 text-[11px] font-bold text-emerald-700">{who.name}</p>
                        ) : null}
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <div className="mt-0.5 flex items-center justify-end gap-2">
                          <span className={`text-[10px] ${mine ? "text-white/80" : "text-[var(--app-muted)]"}`}>
                            {formatTime(msg.created_at)}
                          </span>
                          {!mine ? (
                            <button
                              type="button"
                              aria-label="…"
                              onClick={() => setActionMsg(msg)}
                              className="text-xs font-bold text-[var(--app-muted)]"
                            >
                              …
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {closed ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
                {t("Өрөө хаагдсан")}
              </p>
            ) : (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    rows={1}
                    maxLength={MESSAGE_MAX_LENGTH}
                    placeholder={t("Мессеж бичих...")}
                    className="max-h-32 min-h-[44px] w-full resize-none rounded-2xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm"
                  />
                  {draft.length > MESSAGE_MAX_LENGTH - 200 ? (
                    <p className="text-right text-[10px] text-[var(--app-muted)]">
                      {draft.length}/{MESSAGE_MAX_LENGTH}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={sending || !draft.trim()}
                  onClick={() => void handleSend()}
                  className="app-btn-primary disabled:opacity-50"
                >
                  {t("Явуулах")}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {actionMsg ? (
        <Sheet onClose={() => setActionMsg(null)}>
          <p className="mb-3 line-clamp-3 text-xs text-[var(--app-muted)]">{actionMsg.body}</p>
          <button
            type="button"
            onClick={() => void handleReport(actionMsg)}
            className="app-btn-secondary w-full"
          >
            ⚑ {t("Мэдээлэх")}
          </button>
          <button
            type="button"
            onClick={() => void handleBlock(actionMsg.user_id)}
            className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-red-200 bg-red-50 text-sm font-semibold text-red-700"
          >
            🚫 {t("Хориглох")}
          </button>
        </Sheet>
      ) : null}

      {drawer ? (
        <Sheet onClose={() => setDrawer(false)}>
          <h2 className="mb-2 text-sm font-bold">
            {t("Гишүүд")} ({members.length})
          </h2>
          <ul className="max-h-[50vh] overflow-y-auto">
            {sortedMembers.map((m) => (
              <li key={m.user_id} className="flex items-center gap-3 py-2">
                <Link
                  href={`/u/${m.user_id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                  onClick={() => setDrawer(false)}
                >
                  <SocialAvatar name={m.display_name} avatar={m.avatar} size={36} />
                  <span className="truncate text-sm font-semibold">
                    {m.display_name || "—"}
                    {m.user_id === userId ? ` (${t("Та")})` : ""}
                  </span>
                  {m.role === "owner" ? (
                    <span className="text-[11px] text-emerald-700">{t("Эзэн")}</span>
                  ) : null}
                </Link>
                {isOwner && m.role !== "owner" ? (
                  <button
                    type="button"
                    onClick={() => void handleRemoveMember(m.user_id)}
                    className="text-xs font-semibold text-red-600"
                  >
                    {t("Хасах")}
                  </button>
                ) : null}
                {m.user_id !== userId && blocked.has(m.user_id) ? (
                  <button
                    type="button"
                    onClick={() => void handleUnblock(m.user_id)}
                    className="text-xs font-semibold text-emerald-700"
                  >
                    {t("Хориг арилгах")}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-[var(--app-border)] pt-3">
            {canRename ? (
              <button type="button" onClick={() => void handleRename()} className="app-btn-secondary w-full">
                ✏️ {t("Нэр өөрчлөх")}
              </button>
            ) : null}
            {isOwner && room.kind !== "age" && room.kind !== "dm" && room.kind !== "class" ? (
              <button type="button" onClick={() => void handleToggleClosed()} className="app-btn-secondary w-full">
                {room.is_closed ? t("Дахин нээх") : t("Хаах")}
              </button>
            ) : null}
            {!isOwner ? (
              <button
                type="button"
                onClick={() => void handleLeave()}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-red-200 bg-red-50 text-sm font-semibold text-red-700"
              >
                {t("Гарах")}
              </button>
            ) : null}
          </div>
        </Sheet>
      ) : null}
    </MobileAppShell>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[480px] rounded-t-3xl bg-white p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
