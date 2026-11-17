"use client";

import { markRoomSeen } from "@/lib/social/unread";
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
import {
  buildPollBody,
  fetchPollTallies,
  parsePoll,
  votePoll,
  type PollTally,
} from "@/lib/social/polls";
import { listLevelRooms } from "@/lib/social/rooms";
import { createChallenge, fetchChallengeStatus, type ChallengeStatus } from "@/lib/social/challenges";
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
  const [tallies, setTallies] = useState<Record<number, PollTally>>({});
  const [pollOpen, setPollOpen] = useState(false);
  const [pollQ, setPollQ] = useState("");
  const [pollOpts, setPollOpts] = useState("");
  const [pollAll, setPollAll] = useState(false);
  // 7 хоногийн сорилт (112 SQL)
  const [challenge, setChallenge] = useState<ChallengeStatus | null>(null);
  const [chOpen, setChOpen] = useState(false);
  const [chTitle, setChTitle] = useState("Бүгдээрээ 500 үг цээжилье!");
  const [chTarget, setChTarget] = useState("500");
  const [chAll, setChAll] = useState(false);
  const refreshChallenge = useCallback(async () => {
    setChallenge(await fetchChallengeStatus(roomId));
  }, [roomId]);
  useEffect(() => {
    void refreshChallenge();
    const timer = window.setInterval(() => void refreshChallenge(), 120_000);
    return () => window.clearInterval(timer);
  }, [refreshChallenge]);

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
      return {
        name: m?.display_name || t("Сурагч"),
        avatar: m?.avatar ?? null,
        host: m?.role === "owner",
      };
    },
    [members, t]
  );
  // Хөтлөгч (өрөөний эзэн / 105 SQL-ээр тавьсан админ) — санал асуулга явуулж чадна.
  const amHost = isOwner || members.some((m) => m.user_id === userId && m.role === "owner");

  // Энэ өрөөний мессежүүдийг «уншсан» гэж тэмдэглэнэ (уншаагүй тоонд хэрэглэнэ).
  useEffect(() => {
    if (messages.length > 0) markRoomSeen(roomId, messages[messages.length - 1].id);
  }, [messages, roomId]);

  const pollIds = useMemo(
    () => messages.filter((m) => parsePoll(m.body)).map((m) => m.id),
    [messages]
  );
  const pollKey = pollIds.join(",");
  const refreshTallies = useCallback(async () => {
    if (!pollKey) return;
    const ids = pollKey.split(",").map(Number);
    const counts: Record<number, number> = {};
    for (const m of messages) {
      const p = parsePoll(m.body);
      if (p) counts[m.id] = p.options.length;
    }
    setTallies(await fetchPollTallies(ids, userId, counts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollKey, userId]);
  useEffect(() => {
    if (!pollKey) return;
    void refreshTallies();
    const timer = window.setInterval(() => void refreshTallies(), 20_000);
    return () => window.clearInterval(timer);
  }, [pollKey, refreshTallies]);

  async function handleVote(messageId: number, idx: number) {
    setTallies((prev) => {
      const cur = prev[messageId];
      if (!cur) return prev;
      const counts = [...cur.counts];
      if (cur.mine != null && counts[cur.mine] > 0) counts[cur.mine] -= 1;
      counts[idx] = (counts[idx] ?? 0) + 1;
      return { ...prev, [messageId]: { counts, total: cur.total + (cur.mine == null ? 1 : 0), mine: idx } };
    });
    const err = await votePoll(messageId, userId, idx);
    if (err) setError(err);
    void refreshTallies();
  }

  async function handleCreateChallenge() {
    const target = Math.round(Number(chTarget));
    if (!chTitle.trim() || !Number.isFinite(target) || target < 10 || sending) return;
    setSending(true);
    setError(null);
    let targets = [roomId];
    if (chAll) {
      const lv = await listLevelRooms();
      const ids = (lv.data ?? []).filter((r) => r.is_member).map((r) => r.id);
      if (ids.length) targets = Array.from(new Set([roomId, ...ids]));
    }
    const err = await createChallenge(targets, userId, chTitle, target, 7);
    setSending(false);
    if (err) {
      setError(err);
      return;
    }
    setChOpen(false);
    setNotice(targets.length > 1 ? `${targets.length} ${t("чатад сорилт зарлалаа.")}` : t("Сорилт зарлалаа."));
    void refreshChallenge();
  }

  async function handleSendPoll() {
    const options = pollOpts.split("\n").map((o) => o.trim()).filter(Boolean).slice(0, 6);
    if (!pollQ.trim() || options.length < 2 || sending) return;
    const body = buildPollBody(pollQ, options);
    setSending(true);
    setError(null);
    let targets = [roomId];
    if (pollAll) {
      const lv = await listLevelRooms();
      const ids = (lv.data ?? []).filter((r) => r.is_member).map((r) => r.id);
      if (ids.length) targets = Array.from(new Set([roomId, ...ids]));
    }
    for (const rid of targets) {
      const res = await sendMessage(rid, userId, body);
      if (res.error) setError(res.error);
      else if (rid === roomId && res.data) {
        const sent = res.data;
        stickRef.current = true;
        setMessages((prev) => (prev.some((p) => p.id === sent.id) ? prev : [...prev, sent]));
      }
    }
    setSending(false);
    setPollOpen(false);
    setPollQ("");
    setPollOpts("");
    if (targets.length > 1) setNotice(`${targets.length} ${t("чатад явууллаа.")}`);
  }

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

        {isMember && challenge ? (
          <div className="bs-chal">
            <div className="bs-chal-top">
              <span className="bs-chal-kicker">🏆 {t("Энэ 7 хоногийн сорилт")}</span>
              <span className="bs-chal-left">
                {Math.max(0, Math.ceil((new Date(challenge.endsAt).getTime() - Date.now()) / 86_400_000))} {t("өдөр үлдсэн")}
              </span>
            </div>
            <p className="bs-chal-title">{challenge.title}</p>
            <div className="bs-chal-bar" aria-hidden>
              <span style={{ width: `${Math.min(100, (challenge.total / Math.max(1, challenge.target)) * 100)}%` }} />
            </div>
            <div className="bs-chal-nums">
              <span>
                {challenge.total} / {challenge.target} {t("үг")}
              </span>
              <span className="bs-chal-mine">
                {t("Чи")}: {challenge.mine} {t("үг")}
              </span>
            </div>
            {challenge.top.length > 0 ? (
              <div className="bs-chal-top3">
                {challenge.top.map((row, i) => (
                  <span key={`${row.name}-${i}`}>
                    {["🥇", "🥈", "🥉"][i]} {row.name} {row.n}
                  </span>
                ))}
              </div>
            ) : null}
            <Link
              href={`/games/learn?mylevel=${/(\d)/.exec(room.title ?? "")?.[1] ?? "1"}`}
              className="bs-chal-btn"
            >
              {challenge.total >= challenge.target ? t("Зорилгодоо хүрлээ! Дахиад нэмэх") : t("Одоо 10 үг нэмэх")} →
            </Link>
          </div>
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
                          <p className="mb-0.5 text-[11px] font-bold text-emerald-700">
                            {who.name}
                            {who.host ? (
                              <span className="ml-1 rounded-full bg-emerald-600 px-1.5 py-[1px] text-[9px] font-bold text-white">
                                {t("Админ")}
                              </span>
                            ) : null}
                          </p>
                        ) : null}
                        {(() => {
                          const poll = parsePoll(msg.body);
                          if (!poll) return <p className="whitespace-pre-wrap break-words">{msg.body}</p>;
                          const tally = tallies[msg.id];
                          return (
                            <div className="min-w-[210px]">
                              <p className="mb-2 text-sm font-bold">📊 {poll.question}</p>
                              <div className="flex flex-col gap-1.5">
                                {poll.options.map((opt, idx) => {
                                  const n = tally?.counts[idx] ?? 0;
                                  const pct = tally && tally.total > 0 ? Math.round((n / tally.total) * 100) : 0;
                                  const picked = tally?.mine === idx;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      disabled={!isMember}
                                      onClick={() => void handleVote(msg.id, idx)}
                                      className={`bs-poll-opt${picked ? " bs-poll-opt--on" : ""}`}
                                    >
                                      <span className="bs-poll-bar" style={{ width: `${pct}%` }} />
                                      <span className="bs-poll-label">
                                        {picked ? "✓ " : ""}
                                        {opt}
                                      </span>
                                      <span className="bs-poll-n">
                                        {n} · {pct}%
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="mt-1.5 text-[10px] opacity-80">
                                {tally?.total ?? 0} {t("хүн санал өгсөн")}
                              </p>
                            </div>
                          );
                        })()}
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
                {amHost ? (
                  <button
                    type="button"
                    aria-label={t("Санал асуулга")}
                    title={t("Санал асуулга")}
                    onClick={() => setPollOpen(true)}
                    className="app-btn-secondary !min-h-[44px] !px-3"
                  >
                    📊
                  </button>
                ) : null}
                {amHost ? (
                  <button
                    type="button"
                    aria-label={t("7 хоногийн сорилт")}
                    title={t("7 хоногийн сорилт")}
                    onClick={() => setChOpen(true)}
                    className="app-btn-secondary !min-h-[44px] !px-3"
                  >
                    🏆
                  </button>
                ) : null}
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

      {chOpen ? (
        <Sheet onClose={() => setChOpen(false)}>
          <h2 className="mb-3 text-sm font-bold">🏆 {t("7 хоногийн сорилт зарлах")}</h2>
          <label className="block text-xs font-semibold text-[var(--app-muted)]">
            {t("Сорилтын нэр")}
            <input
              value={chTitle}
              onChange={(e) => setChTitle(e.target.value.slice(0, 120))}
              className="mt-1 w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm text-[var(--app-text)]"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--app-muted)]">
            {t("Зорилго — бүгд нийлээд хэдэн үг (7 хоногт)")}
            <input
              value={chTarget}
              inputMode="numeric"
              onChange={(e) => setChTarget(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              className="mt-1 w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm text-[var(--app-text)]"
            />
          </label>
          <p className="mt-2 text-xs text-[var(--app-muted)]">
            {t("Гишүүдийн «Үг цээжлэх», «Давтах» дээр «мэднэ» гэж тэмдэглэсэн үг автоматаар тоологдоно.")}
          </p>
          {room.kind === "level" ? (
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={chAll} onChange={(e) => setChAll(e.target.checked)} />
              {t("Түвшний бүх чатад зэрэг зарлах")}
            </label>
          ) : null}
          <button
            type="button"
            disabled={sending || !chTitle.trim() || Number(chTarget) < 10}
            onClick={() => void handleCreateChallenge()}
            className="app-btn-primary mt-4 w-full disabled:opacity-50"
          >
            {t("Зарлах")}
          </button>
        </Sheet>
      ) : null}

      {pollOpen ? (
        <Sheet onClose={() => setPollOpen(false)}>
          <h2 className="mb-3 text-sm font-bold">📊 {t("Санал асуулга")}</h2>
          <label className="block text-xs font-semibold text-[var(--app-muted)]">
            {t("Асуулт")}
            <input
              value={pollQ}
              onChange={(e) => setPollQ(e.target.value.slice(0, 200))}
              className="mt-1 w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm text-[var(--app-text)]"
              placeholder={t("Жишээ: Аль хэсэг хамгийн хэрэгтэй байна?")}
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--app-muted)]">
            {t("Сонголтууд — мөр бүрд нэг (2–6)")}
            <textarea
              value={pollOpts}
              onChange={(e) => setPollOpts(e.target.value.slice(0, 600))}
              rows={5}
              className="mt-1 w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm text-[var(--app-text)]"
              placeholder={"Хичээл\nҮг цээжлэх\nШалгалт\nБичлэг"}
            />
          </label>
          {room.kind === "level" ? (
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={pollAll} onChange={(e) => setPollAll(e.target.checked)} />
              {t("Түвшний бүх чатад зэрэг явуулах")}
            </label>
          ) : null}
          <button
            type="button"
            disabled={sending || !pollQ.trim() || pollOpts.split("\n").filter((o) => o.trim()).length < 2}
            onClick={() => void handleSendPoll()}
            className="app-btn-primary mt-4 w-full disabled:opacity-50"
          >
            {t("Явуулах")}
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
                    {m.display_name || t("Сурагч")}
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
