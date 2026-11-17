"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getPrimaryPosLabelMn } from "@/lib/hsk/pos-catalog";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  deleteUserSavedWord,
  fetchOrphanSavedWords,
  type UserSavedWordRow,
} from "@/lib/supabase/saved-words";
import {
  getUserSrsWordList,
  isMasteredSrs,
  markWordMastered,
  unmarkWordMastered,
  type SrsWordListItem,
} from "@/lib/supabase/user-word-srs";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";

type Filter = "all" | "bichleg";
type Tab = "active" | "mastered";

function formatDueLabel(dueAt: string, reps: number): string {
  if (reps === 0) return "Шинэ";
  const due = new Date(dueAt);
  const now = new Date();
  if (due <= now) return "Давтах";
  const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  return `${days} өдрийн дараа`;
}

export function WordSrsWordsClient() {
  useActivityTracker("review", "words");
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<SrsWordListItem[]>([]);
  const [orphans, setOrphans] = useState<UserSavedWordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("active");
  const [busyWordId, setBusyWordId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!hasSupabaseConfig) {
      setItems([]);
      setOrphans([]);
      setLoading(false);
      return;
    }

    const { userId } = await getAuthenticatedUserId();
    if (!userId) {
      setItems([]);
      setOrphans([]);
      setError("Нэвтэрч орно уу — үгсийн жагсаалт харагдана.");
      setLoading(false);
      return;
    }

    const [{ items: srsItems, error: srsError }, orphanRows] = await Promise.all([
      getUserSrsWordList(userId, filter),
      fetchOrphanSavedWords(userId),
    ]);

    if (srsError) {
      setError(srsError);
      setItems([]);
    } else {
      setItems(srsItems);
    }
    setOrphans(orphanRows);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDeleteOrphan(id: string) {
    setDeletingId(id);
    const result = await deleteUserSavedWord(id);
    setDeletingId(null);
    if (result.ok) {
      setOrphans((prev) => prev.filter((row) => row.id !== id));
    } else if (result.error) {
      setError(result.error);
    }
  }

  async function handleMastered(wordId: number, mastered: boolean) {
    const { userId } = await getAuthenticatedUserId();
    if (!userId) return;
    setBusyWordId(wordId);
    const res = mastered ? await markWordMastered(userId, wordId) : await unmarkWordMastered(userId, wordId);
    setBusyWordId(null);
    if (res.error || !res.data) {
      setError(res.error ?? "Хадгалж чадсангүй.");
      return;
    }
    const updated = res.data;
    setItems((prev) => prev.map((it) => (it.srs.word_id === wordId ? { ...it, srs: updated } : it)));
  }

  const activeItems = items.filter((it) => !isMasteredSrs(it.srs));
  const masteredItems = items.filter((it) => isMasteredSrs(it.srs));
  const shownItems = tab === "active" ? activeItems : masteredItems;

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-[var(--app-muted)]">
        Ачааллаж байна…
      </p>
    );
  }

  return (
    <div className="bs-srs-words">
      <h1 className="bs-srs-words-title">Миний үгс</h1>
      <p className="bs-srs-words-sub">
        Хичээл, бичлэг, тольноос хадгалсан үгс чинь энд цугларч, давталтын системээр (SRS) цээжлэгдэнэ.
      </p>
      {items.length > 0 ? (
        <div className="bs-srs-words-stats">
          <span className="bs-srs-words-stat">
            <b>{activeItems.length}</b> үг цээжилж буй
          </span>
          <span className="bs-srs-words-stat">
            <b>{activeItems.filter((it) => new Date(it.srs.due_at).getTime() <= Date.now()).length}</b> өнөөдөр давтах
          </span>
          <span className="bs-srs-words-stat">
            <b>{masteredItems.length}</b> цээжилсэн
          </span>
          <Link href="/review/daily" className="bs-srs-words-start">
            Давтаж эхлэх →
          </Link>
        </div>
      ) : null}

      <div className="bs-srs-words-filters">
        <button
          type="button"
          className={`bs-srs-words-filter ${tab === "active" ? "bs-srs-words-filter--on" : ""}`}
          onClick={() => setTab("active")}
        >
          Цээжилж буй {activeItems.length}
        </button>
        <button
          type="button"
          className={`bs-srs-words-filter ${tab === "mastered" ? "bs-srs-words-filter--on" : ""}`}
          onClick={() => setTab("mastered")}
        >
          ✓ Цээжилсэн {masteredItems.length}
        </button>
        <Link href="/dictionary/levels" className="bs-srs-words-filter bs-srs-words-add">
          + HSK үгсээс нэмэх
        </Link>
      </div>
      <div className="bs-srs-words-filters">
        <button
          type="button"
          className={`bs-srs-words-filter ${filter === "all" ? "bs-srs-words-filter--on" : ""}`}
          onClick={() => setFilter("all")}
        >
          Бүгд
        </button>
        <button
          type="button"
          className={`bs-srs-words-filter ${filter === "bichleg" ? "bs-srs-words-filter--on" : ""}`}
          onClick={() => setFilter("bichleg")}
        >
          Бичлэгээс
        </button>
      </div>

      {error ? (
        <p className="bs-srs-words-error">{error}</p>
      ) : null}

      {tab === "mastered" && masteredItems.length > 0 ? (
        <p className="bs-srs-words-sub">
          Цээжилсэн үг идэвхтэй жагсаалт, тоглоомоос гарна. Мартсан эсэхийг шалгахаар сарын дараа нэг удаа асууна.
        </p>
      ) : null}

      {shownItems.length === 0 && !error ? (
        <p className="bs-srs-words-empty">
          {tab === "mastered"
            ? "Цээжилсэн үг хараахан алга. Сайн мэддэг үгэн дээрээ «Цээжилсэн ✓» дараарай."
            : filter === "bichleg"
              ? "Бичлэгээс нэмсэн үг алга."
              : "Цээжилж буй үг алга. «+ HSK үгсээс нэмэх» дээр дарж үгээ сонгоорой."}
        </p>
      ) : (
        <ul className="bs-srs-words-list">
          {shownItems.map(({ srs, word, fromBichleg }) => {
            const posLabel = getPrimaryPosLabelMn(word.pos);
            return (
              <li key={srs.id} className="bs-srs-words-item">
                <div className="bs-srs-words-item-head">
                  <span className="bs-srs-words-hanzi hanzi">{word.simplified}</span>
                  {fromBichleg ? (
                    <span className="bs-srs-words-bichleg-badge" title="Бичлэгээс">
                      ▶
                    </span>
                  ) : null}
                  <span className="bs-srs-words-due">
                    {formatDueLabel(srs.due_at, srs.reps)}
                  </span>
                </div>
                {word.pinyin ? (
                  <p className="bs-srs-words-pinyin">{word.pinyin}</p>
                ) : null}
                {word.meaning_mn ? (
                  <p className="bs-srs-words-meaning" translate="no">{word.meaning_mn}</p>
                ) : null}
                <div className="bs-srs-words-meta">
                  {word.hsk_level ? (
                    <span className="bs-srs-words-tag">HSK {word.hsk_level}</span>
                  ) : null}
                  {posLabel ? (
                    <span className="bs-srs-words-tag">{posLabel}</span>
                  ) : null}
                  {srs.reps > 0 ? (
                    <span className="bs-srs-words-tag">
                      {srs.reps} удаа сурсан
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="bs-srs-words-master"
                    disabled={busyWordId === srs.word_id}
                    onClick={() => void handleMastered(srs.word_id, tab === "active")}
                  >
                    {busyWordId === srs.word_id ? "…" : tab === "active" ? "Цээжилсэн ✓" : "↩ Буцааж давтах"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {orphans.length > 0 ? (
        <section className="bs-srs-words-orphan">
          <h2 className="bs-srs-words-orphan-title">Толь бичигт байхгүй үгс</h2>
          <p className="bs-srs-words-orphan-sub">
            Эдгээр үг зөвхөн таны хадгалсан жагсаалтад байна — SRS-д орохгүй.
          </p>
          <ul className="bs-srs-words-orphan-list">
            {orphans.map((row) => (
              <li key={row.id} className="bs-srs-words-orphan-item">
                <div>
                  <p className="bs-srs-words-hanzi hanzi">{row.zh}</p>
                  {row.pinyin ? (
                    <p className="bs-srs-words-pinyin">{row.pinyin}</p>
                  ) : null}
                  {row.mn ? (
                    <p className="bs-srs-words-meaning" translate="no">{row.mn}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="bs-srs-words-delete"
                  disabled={deletingId === row.id}
                  onClick={() => void handleDeleteOrphan(row.id)}
                >
                  {deletingId === row.id ? "…" : "Устгах"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
