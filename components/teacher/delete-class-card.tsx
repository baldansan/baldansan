"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteClassroom } from "@/lib/supabase/classrooms";

type Props = {
  classroomId: string;
  className: string;
  studentCount: number;
};

/**
 * Ангийг устгах — «Бүртгэл» табын хамгийн доор.
 * Андуурч дарахаас сэргийлж хоёр алхамтай: эхлээд «Устгах» → дараа нь ангийн нэрийг бичиж батална.
 */
export function DeleteClassCard({ classroomId, className, studentCount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = typed.trim() === className.trim();

  const remove = async () => {
    if (!matches || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await deleteClassroom(classroomId);
    if (err) {
      setError(`Устгаж чадсангүй: ${err}`);
      setBusy(false);
      return;
    }
    try {
      window.localStorage.removeItem("bs.teacher.classes.cache.v1");
    } catch {
      /* noop */
    }
    router.push("/teacher/classes");
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
      <h2 className="text-base font-semibold text-rose-900">Ангийг устгах</h2>
      <p className="mt-1 text-sm leading-6 text-rose-900/80">
        Анги, түүний даалгавар, ирц, шалгалтын бүртгэл бүгд устана. Буцаах боломжгүй.
        {studentCount > 0
          ? ` Энэ ангид ${studentCount} сурагч байна — тэдний хувийн ахиц устахгүй, зөвхөн ангиас гарна.`
          : ""}
      </p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
        >
          Ангийг устгах…
        </button>
      ) : (
        <div className="mt-3">
          <label className="block text-sm font-medium text-rose-900" htmlFor="delete-class-confirm">
            Батлахын тулд ангийн нэрийг яг бичнэ үү: <span translate="no" className="font-bold">{className}</span>
          </label>
          <input
            id="delete-class-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void remove()}
              disabled={!matches || busy}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Устгаж байна…" : "Бүрмөсөн устгах"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError(null);
              }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Болих
            </button>
          </div>
          {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
