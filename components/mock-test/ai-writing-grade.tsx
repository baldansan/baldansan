"use client";

import { useState } from "react";
import { requestWritingGrade, type WritingGradeReply } from "@/lib/mock-test/writing-grade";

type Props = {
  questionId: string;
  /** Суралцагчийн бичсэн текст */
  answer: string | null;
  /** AI дүгнэлт гарсны дараа «зөв/буруу» гэж бүртгэх (60+ = зөв). */
  onGraded?: (passed: boolean, reply: WritingGradeReply) => void;
};

/**
 * «🤖 AI багшаар үнэлүүлэх» — эссэ / 缩写 / зургаар өгүүлбэр.
 * 4 шалгуур (1–5), засвар, сайжруулсан хувилбар, монгол зөвлөгөө.
 */
export function AiWritingGrade({ questionId, answer, onGraded }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<WritingGradeReply | null>(null);
  const [showImproved, setShowImproved] = useState(false);

  const text = answer?.trim() ?? "";
  if (text.length < 2) {
    return <p className="bs-mtp-ai-note">Эхлээд өөрийн хариултаа бичвэл AI багш үнэлж өгнө.</p>;
  }

  async function grade() {
    setLoading(true);
    setError(null);
    const res = await requestWritingGrade(questionId, text);
    setLoading(false);
    if (!res.ok) {
      setError(
        res.fallback
          ? "AI үнэлгээ одоогоор идэвхгүй — өөрөө үнэлнэ үү."
          : res.message || "AI үнэлгээ амжилтгүй."
      );
      return;
    }
    setReply(res.reply);
    onGraded?.(res.reply.passed, res.reply);
  }

  if (!reply) {
    return (
      <div className="bs-mtp-ai">
        <button type="button" className="bs-mtp-ai-btn" onClick={() => void grade()} disabled={loading}>
          {loading ? "AI багш шалгаж байна…" : "🤖 AI багшаар үнэлүүлэх"}
        </button>
        {error ? <p className="bs-mtp-ai-err">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={`bs-mtp-ai bs-mtp-ai--${reply.passed ? "ok" : "bad"}`}>
      <div className="bs-mtp-ai-head">
        <span className="bs-mtp-ai-score">{reply.score}</span>
        <span className="bs-mtp-ai-score-meta">
          / 100 · {reply.passed ? "Тэнцэх түвшин ✓" : "60-д хүрсэнгүй"} · {reply.wordCount} тэмдэгт
        </span>
      </div>

      <ul className="bs-mtp-ai-criteria">
        {reply.criteria.map((c) => (
          <li key={c.name_mn}>
            <div className="bs-mtp-ai-crit-head">
              <span>{c.name_mn}</span>
              <span className="bs-mtp-ai-stars" aria-label={`${c.score}/5`}>
                {"★".repeat(c.score)}
                <span className="bs-mtp-ai-stars-dim">{"★".repeat(5 - c.score)}</span>
              </span>
            </div>
            {c.comment_mn ? <p>{c.comment_mn}</p> : null}
          </li>
        ))}
      </ul>

      {reply.corrections.length > 0 ? (
        <div className="bs-mtp-ai-corr">
          <p className="bs-mtp-ai-sec">Засвар</p>
          {reply.corrections.map((c, i) => (
            <div key={i} className="bs-mtp-ai-corr-row">
              <p className="hanzi" translate="no">
                <s>{c.wrong}</s> → <b>{c.right}</b>
              </p>
              {c.why_mn ? <p className="bs-mtp-ai-why">{c.why_mn}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {reply.adviceMn ? (
        <p className="bs-mtp-ai-advice">💡 {reply.adviceMn}</p>
      ) : null}

      {reply.improvedZh ? (
        <div>
          <button type="button" className="bs-mtp-ai-link" onClick={() => setShowImproved((v) => !v)}>
            {showImproved ? "Сайжруулсан хувилбарыг нуух" : "Сайжруулсан хувилбарыг харах"}
          </button>
          {showImproved ? (
            <p className="bs-mtp-ai-improved hanzi" translate="no">{reply.improvedZh}</p>
          ) : null}
        </div>
      ) : null}
      <p className="bs-mtp-ai-note">AI үнэлгээ — жишиг төдий, албан ёсны оноо биш.</p>
    </div>
  );
}
