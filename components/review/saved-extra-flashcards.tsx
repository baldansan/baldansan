"use client";

import { useEffect, useState } from "react";
import { SpeakerButton } from "@/components/tts/speaker-button";
import type { UserSavedWordRow } from "@/lib/supabase/saved-words";

/**
 * Толиос хадгалсан, HSK жагсаалтад байхгүй үгсийг картаар эргүүлж давтана.
 * Эдгээр үг SRS хуваарьт ордоггүй тул энгийн «мэднэ / дахин» эргэлт:
 * «дахин» гэсэн карт дарааллын төгсгөлд буцаж ирнэ.
 */
export function SavedExtraFlashcards({
  words,
  onClose,
}: {
  words: UserSavedWordRow[];
  onClose: () => void;
}) {
  const [queue, setQueue] = useState<UserSavedWordRow[]>(words);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);

  // Холих нь зөвхөн client дээр (hydration-д нөлөөлөхгүй).
  useEffect(() => {
    const arr = [...words];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setQueue(arr);
    setKnown(0);
    setFlipped(false);
  }, [words]);

  const card = queue[0];

  function next(knewIt: boolean) {
    setFlipped(false);
    setQueue((q) => (knewIt ? q.slice(1) : [...q.slice(1), q[0]]));
    if (knewIt) setKnown((k) => k + 1);
  }

  return (
    <div className="bs-extra-cards" role="dialog" aria-label="Картаар давтах">
      <div className="bs-extra-cards-top">
        <span>
          {known} / {words.length}
        </span>
        <button type="button" className="bs-extra-cards-close" onClick={onClose}>
          ✕ Хаах
        </button>
      </div>

      {card ? (
        <>
          <button type="button" className="bs-extra-card" onClick={() => setFlipped((v) => !v)}>
            <span className="hanzi bs-extra-card-zh">{card.zh}</span>
            {flipped ? (
              <>
                {card.pinyin ? <span className="bs-extra-card-py">{card.pinyin}</span> : null}
                <span className="bs-extra-card-mn" translate="no">
                  {card.mn || "—"}
                </span>
              </>
            ) : (
              <span className="bs-extra-card-hint">Дарж утгыг нь хар</span>
            )}
          </button>
          <div className="bs-extra-cards-speak">
            <SpeakerButton text={card.zh} lang="zh-CN" size="md" showInlineError={false} />
          </div>
          <div className="bs-extra-cards-actions">
            <button type="button" className="bs-extra-btn bs-extra-btn--again" onClick={() => next(false)}>
              ↻ Дахин
            </button>
            <button type="button" className="bs-extra-btn bs-extra-btn--know" onClick={() => next(true)}>
              ✓ Мэднэ
            </button>
          </div>
        </>
      ) : (
        <div className="bs-extra-card bs-extra-card--done">
          <span className="bs-extra-card-zh">🎉</span>
          <span className="bs-extra-card-mn">Бүгдийг давтлаа!</span>
          <button type="button" className="bs-extra-btn bs-extra-btn--know" onClick={onClose}>
            Дуусгах
          </button>
        </div>
      )}
    </div>
  );
}
