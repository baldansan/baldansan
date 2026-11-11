import Link from "next/link";
import {
  ADMIN_NAV_ADVANCED,
  ADMIN_NAV_INSIGHTS,
  ADMIN_NAV_LIBRARY,
  ADMIN_NAV_OTHER,
  ADMIN_NAV_PRIMARY,
  ADMIN_NAV_TEACHER,
} from "@/lib/admin/admin-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Систем — бүх хэрэгсэл",
};

function ToolGrid({ items }: { items: typeof ADMIN_NAV_ADVANCED }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-emerald-200"
        >
          <span className="text-sm font-semibold text-slate-800">
            <span aria-hidden className="mr-2">
              {item.icon}
            </span>
            {item.label}
          </span>
          {item.hint ? (
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              {item.hint}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Систем — бүх хэрэгсэл</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ажлын талбарын БҮХ хуудас нэг дор. Цэснээс олохгүй байгаа зүйлээ эндээс хайна.
          Доод хэсгийн техникийн хэрэгслүүд өдөр тутмын ажилд хэрэггүй.
        </p>
      </header>

      <section>
        <h2 className="admin-section-title">Багшийн ажил</h2>
        <p className="admin-section-desc mb-3">Анги, сурагч, даалгавар, тайлан.</p>
        <ToolGrid items={ADMIN_NAV_TEACHER} />
      </section>

      <section>
        <h2 className="admin-section-title">Хичээлийн сан</h2>
        <p className="admin-section-desc mb-3">Хичээл, шалгалт, бичлэг, импорт.</p>
        <ToolGrid
          items={[
            ...ADMIN_NAV_LIBRARY,
            ...ADMIN_NAV_PRIMARY.filter((i) =>
              ["/admin/lessons", "/admin/source", "/admin/overview"].includes(i.href)
            ),
          ]}
        />
      </section>

      <section>
        <h2 className="admin-section-title">Тайлан ба байгууллага</h2>
        <p className="admin-section-desc mb-3">
          Хичээлийн гүйцэтгэл, бүлгүүдийн харьцуулалт, гэрчилгээ, алдааны мэдээлэл.
        </p>
        <ToolGrid
          items={[
            ...ADMIN_NAV_INSIGHTS.filter(
              (i) => !["/admin/learners", "/admin/feedback", "/admin/b2b"].includes(i.href)
            ),
            ...ADMIN_NAV_OTHER,
          ]}
        />
      </section>

      <section>
        <h2 className="admin-section-title">Техникийн хэрэгсэл</h2>
        <p className="admin-section-desc mb-3">
          Үйлдлийн түүх, системийн шалгалт, гаргалтын баталгаа — ихэвчлэн хөгжүүлэгч ашиглана.
        </p>
        <ToolGrid
          items={ADMIN_NAV_ADVANCED.filter(
            (item) =>
              !item.href.startsWith("/admin/settings") &&
              !item.href.startsWith("/admin/guide")
          )}
        />
      </section>

      <p className="text-sm text-slate-500">
        <Link href="/" className="text-emerald-700 hover:text-emerald-800">
          ← Сурагчийн апп руу буцах
        </Link>
      </p>
    </div>
  );
}
