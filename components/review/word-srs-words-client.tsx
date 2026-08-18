"use client";

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
  type SrsWordListItem,
} from "@/lib/supabase/user-word-srs";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";

type Filter = "all" | "bichleg";

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
        Давталтын системд бүртгэгдсэн HSK үгс
      </p>

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

      {items.length === 0 && !error ? (
        <p className="bs-srs-words-empty">
          {filter === "bichleg"
            ? "Бичлэгээс нэмсэн SRS үг алга."
            : "Одоогоор SRS-д үг бүртгэгдээгүй байна."}
        </p>
      ) : (
        <ul className="bs-srs-words-list">
          {items.map(({ srs, word, fromBichleg }) => {
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
                  <p className="bs-srs-words-meaning">{word.meaning_mn}</p>
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
                    <p className="bs-srs-words-meaning">{row.mn}</p>
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
