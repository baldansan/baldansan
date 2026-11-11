import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TeacherBlockButton } from "@/components/admin/teacher-block-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Багш нар — Удирдлагын хэсэг",
};

type TeacherRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  blocked: boolean;
  class_count: number;
  student_count: number;
  assignment_count: number;
  last_class_at: string | null;
};

function dayText(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export default async function AdminTeachersPage() {
  const client = await createServerSupabaseClient();
  let rows: TeacherRow[] = [];
  let missing = false;
  let errorText: string | null = null;
  if (client) {
    const { data, error } = await client.rpc("admin_teacher_list");
    if (error) {
      missing = /does not exist|schema cache|Could not find|PGRST202|42883/i.test(
        `${error.code} ${error.message}`
      );
      if (!missing) errorText = error.message;
    } else {
      rows = ((data ?? []) as TeacherRow[]).sort(
        (a, b) => Number(b.student_count) - Number(a.student_count)
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Багш нар"
        description="Апп дээр анги үүсгэсэн бүх хүн. Танихгүй эсвэл зохисгүй хүн байвал «Хаах» дарж шинэ анги үүсгэхийг нь зогсооно."
      />

      {missing ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Энэ хуудас 091_teacher_workspace_extras.sql файлыг Supabase дээр ажиллуулсны дараа
          ажиллана.
        </p>
      ) : errorText ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{errorText}</p>
      ) : rows.length === 0 ? (
        <p className="admin-panel p-5 text-sm text-slate-600">
          Одоогоор анги үүсгэсэн хүн алга.
        </p>
      ) : (
        <div className="admin-table-wrap overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-3 py-2.5 font-semibold">Багш</th>
                <th className="px-3 py-2.5 text-right font-semibold">Анги</th>
                <th className="px-3 py-2.5 text-right font-semibold">Сурагч</th>
                <th className="px-3 py-2.5 text-right font-semibold">Даалгавар</th>
                <th className="px-3 py-2.5 font-semibold">Сүүлд анги нээсэн</th>
                <th className="px-3 py-2.5 font-semibold">Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.user_id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-900" translate="no">
                      {t.display_name?.trim() || t.email || "Нэргүй"}
                    </p>
                    {t.display_name?.trim() && t.email ? (
                      <p className="text-xs text-slate-500">{t.email}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{Number(t.class_count)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{Number(t.student_count)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {Number(t.assignment_count)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{dayText(t.last_class_at)}</td>
                  <td className="px-3 py-2.5">
                    <TeacherBlockButton userId={t.user_id} blocked={Boolean(t.blocked)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs leading-5 text-slate-500">
        Одоогийн дүрэм: нэвтэрсэн хэн ч анги үүсгэж болно (багш нар өөрсдөө бүртгүүлээд шууд
        эхлэхэд амар). «Хаах» дарсан хүн шинэ анги үүсгэж чадахгүй; өмнө үүсгэсэн анги нь
        хэвээр үлдэнэ.
      </p>
    </div>
  );
}
