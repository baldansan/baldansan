import Link from "next/link";
import {
  ADMIN_NAV_ADVANCED,
  ADMIN_NAV_INSIGHTS,
} from "@/lib/admin/admin-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Тохиргоо — Админ",
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
        <h1 className="text-2xl font-bold text-slate-900">Тохиргоо</h1>
        <p className="mt-1 text-sm text-slate-600">
          Админы бүх хэрэгслийн жагсаалт — өдөр тутмын ажилд ихэвчлэн хэрэггүй.
        </p>
      </header>

      <section>
        <h2 className="admin-section-title">Тайлан ба хэрэглэгч</h2>
        <p className="admin-section-desc mb-3">
          Сурагчдын идэвх, байгууллагын бүртгэл, даалгаврын төв.
        </p>
        <ToolGrid items={ADMIN_NAV_INSIGHTS} />
      </section>

      <section>
        <h2 className="admin-section-title">Нэмэлт хэрэгсэл</h2>
        <p className="admin-section-desc mb-3">
          Үйлдлийн лог, системийн шалгалт, гаргалтын баталгаа.
        </p>
        <ToolGrid
          items={ADMIN_NAV_ADVANCED.filter(
            (item) => !item.href.startsWith("/admin/settings")
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
