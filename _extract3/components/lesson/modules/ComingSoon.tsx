"use client";
// components/lesson/modules/ComingSoon.tsx
// Хараахан бичигдээгүй модулийн түр харагдац — player эвдрэхгүй,
// бүх алхмын урсгал ажиллана. (dialogues, texts, grammar, дасгал... дараа нэмнэ.)

export default function ComingSoon({
  label,
  onNext,
}: {
  label: string;
  onNext: () => void;
}) {
  return (
    <div className="bs-card">
      <div className="bs-soon">
        <div className="bs-soon-ic">🚧</div>
        <p>
          <b>{label}</b> модуль удахгүй нэмэгдэнэ.
        </p>
      </div>
      <button className="bs-cta" onClick={onNext} style={{ marginTop: 4 }}>
        Дараагийнх →
      </button>
    </div>
  );
}
