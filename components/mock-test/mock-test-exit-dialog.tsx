"use client";

type Props = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function MockTestExitDialog({ onCancel, onConfirm }: Props) {
  return (
    <div className="bs-mt-exit-backdrop" role="presentation">
      <div className="bs-mt-exit-dialog" role="alertdialog" aria-labelledby="bs-mt-exit-title">
        <p id="bs-mt-exit-title" className="bs-mt-exit-title">
          Шалгалтаас гарах уу?
        </p>
        <p className="bs-mt-exit-text">
          Одоогийн хариулт хадгалагдахгүй. Дахин эхлэх шаардлагатай.
        </p>
        <div className="bs-mt-exit-actions">
          <button type="button" className="bs-mt-exit-cancel" onClick={onCancel}>
            Үргэлжлүүлэх
          </button>
          <button type="button" className="bs-mt-exit-confirm" onClick={onConfirm}>
            Гарах
          </button>
        </div>
      </div>
    </div>
  );
}
