"use client";
// components/layout/PhoneFrame.tsx
// Десктоп дээр аппыг утасны хүрээ (bezel) дотор төвд харуулна + ялгаатай дэвсгэртэй.
// Жинхэнэ утсан дээр (нарийн дэлгэц) хүрээ АЛГА — бүтэн дэлгэцээр (display:contents passthrough).
// Аппынхаа гадна давхаргад (layout) <PhoneFrame>...</PhoneFrame> болгож ороож хэрэглэнэ.
//
// Чухал: дотоод дэлгэц transform: translateZ(0)-тэй тул аппын position:fixed доод
// навигаци (tab bar) ВИЕВПОРТ биш ХҮРЭЭНИЙ ёроолд наалдана — десктоп дээр зөв харагдана.

import "./phone-frame.css";

export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bs-frame-root">
      <div className="bs-frame">
        <div className="bs-frame-notch" aria-hidden />
        <div className="bs-frame-screen">{children}</div>
      </div>
    </div>
  );
}
