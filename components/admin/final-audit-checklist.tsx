import Link from "next/link";

type AuditStatus = "ready" | "needs check" | "planned";

type AuditItem = {
  label: string;
  status: AuditStatus;
  href?: string;
  note?: string;
};

type AuditSection = {
  title: string;
  items: AuditItem[];
};

const SECTIONS: AuditSection[] = [
  {
    title: "Админы хандалт",
    items: [
      { label: "AdminGuard нь /admin хуудсуудыг хамгаална", status: "ready", href: "/admin" },
      {
        label: "admin_profiles хүснэгтийг үүсгэх (Supabase SQL Editor)",
        status: "needs check",
        href: "/admin/final-audit",
        note: "supabase/admin/001_admin_profiles_setup.sql-ийг ажиллуулна",
      },
      { label: "Админ эрхийн шалгалт (is_admin)", status: "ready", href: "/admin" },
      {
        label: "Админ холбоос зөвхөн админд харагдана",
        status: "ready",
        href: "/",
        note: "Толгой хэсгийн AuthStatus хэсэг",
      },
    ],
  },
  {
    title: "Контент удирдлага",
    items: [
      { label: "Ноорог хичээл үүсгэх", status: "ready", href: "/admin/lessons/new" },
      { label: "Ерөнхий мэдээлэл засаж хадгалах", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Хадмал засварлагч", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Үгсийн сангийн засварлагч", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Дасгалын засварлагч", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "JSON-оор бөөнөөр оруулах", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Prompt үүсгэх ба оруулсан өгөгдлийн шалгалт", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "JSON нөөц хуулбар гаргах", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Хувилах / сэргээх", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Хичээл угсрах туслах", status: "ready", href: "/admin/lesson-builder" },
      { label: "Prompt-ын сан", status: "ready", href: "/admin/prompts" },
    ],
  },
  {
    title: "Хувилбар гаргах урсгал",
    items: [
      { label: "Чанарын бэлэн байдлын жагсаалт", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Нийтлэхийг батлах", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Нийтлэх / нийтлэхээ болих / архивлах", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Нийтийн курсын жагсаалт (зөвхөн нийтлэгдсэн)", status: "ready", href: "/courses/hsk5" },
      {
        label: "Админаар урьдчилж харах (?preview=admin)",
        status: "ready",
        href: "/lessons/5?preview=admin",
      },
      {
        label: "Админ бус хүн ноорог харж чадахгүй",
        status: "ready",
        href: "/lessons/5?preview=admin",
      },
    ],
  },
  {
    title: "Медиа",
    items: [
      { label: "Медиагийн ерөнхий мэдээллийн талбарууд", status: "ready", href: "/admin/lessons/5/edit" },
      {
        label: "lesson-media хадгалах сан",
        status: "needs check",
        note: "supabase/storage/001_lesson_media_bucket_policies.sql-ийг ажиллуулна",
      },
      { label: "Медиа байршуулах ба хаяг буулгах", status: "ready", href: "/admin/lessons/5/edit" },
    ],
  },
  {
    title: "Тайлан",
    items: [
      { label: "Хяналтын самбарын үзүүлэлт", status: "ready", href: "/admin" },
      { label: "Хичээл тус бүрийн тайлан", status: "ready", href: "/admin/analytics/lessons/5" },
      { label: "Асуултын тайлан", status: "ready", href: "/admin/analytics/questions" },
      {
        label: "Үгсийн сангийн тайлан",
        status: "ready",
        href: "/admin/analytics/vocabulary",
      },
    ],
  },
  {
    title: "Өдөр тутмын ажиллагаа",
    items: [
      { label: "Ажлын төв", status: "ready", href: "/admin/tasks" },
      {
        label: "Админы ажил хадгалагдана (006)",
        status: "needs check",
        href: "/admin/tasks",
        note: "Supabase дээр 006 migration хийсэн байх шаардлагатай",
      },
      {
        label: "Үйлдлийн бүртгэл харагдана (хөтчийн сешн)",
        status: "ready",
        href: "/admin/activity",
      },
      {
        label: "Үйлдлийн дэлгэрэнгүй, зөрүү, буцаалт",
        status: "ready",
        href: "/admin/activity",
      },
      { label: "Үйлдлийн бүртгэлийг CSV/JSON-оор гаргах", status: "ready", href: "/admin/activity" },
    ],
  },
  {
    title: "Supabase migration (SQL Editor дээр гараар)",
    items: [
      { label: "001_initial_schema.sql", status: "needs check" },
      { label: "002_lesson_media_fields.sql", status: "needs check" },
      { label: "003_lesson_route_status.sql", status: "needs check" },
      { label: "004_admin_lesson_bundle.sql", status: "needs check" },
      { label: "005_grant_is_admin_rpc.sql", status: "needs check" },
      { label: "005_lesson_release_workflow.sql", status: "needs check" },
      { label: "006_admin_tasks.sql", status: "needs check" },
      { label: "007_admin_activity_log.sql", status: "needs check" },
      { label: "008_admin_activity_snapshots.sql", status: "needs check" },
      {
        label: "Нэвтрэлт ба админы RLS дүрмүүд",
        status: "needs check",
        note: "001_auth_rls + 002_admin_content_policies",
      },
    ],
  },
  {
    title: "6-р үе шат — гаргахад бэлтгэсэн хувилбар",
    items: [
      {
        label: "Байршуулалтын шалгалт (/deployment-check)",
        status: "ready",
        href: "/deployment-check",
      },
      {
        label: "Системийн шалгалт (/admin/system-check)",
        status: "ready",
        href: "/admin/system-check",
      },
      {
        label: "Чанарын шалгалт (/admin/production-qa)",
        status: "ready",
        href: "/admin/production-qa",
      },
      {
        label: "Аюулгүй байдал / RLS үзлэг (/admin/security-audit)",
        status: "ready",
        href: "/admin/security-audit",
      },
      {
        label: "Supabase-ийн шалгах SQL",
        status: "needs check",
        note: "supabase/verify/production_verification.sql — алдаатай мөр байхгүй",
      },
      {
        label: "Vercel-ийн орчны хувьсагч ба Auth хаягууд",
        status: "needs check",
        note: "Supabase Auth тохиргоонд https://baldansan.vercel.app байх ёстой",
      },
      {
        label: "Гаргахад бэлтгэсэн хувилбарын төлөв",
        status: "ready",
        href: "/admin/launch-candidate",
        note: "Эцсийн шалгалт ба гаргах шийдвэр",
      },
      {
        label: "Гаргалтын эцсийн баталгаа",
        status: "ready",
        href: "/admin/launch-signoff",
        note: "Гаргах эсэх шийдвэр ба тайлан гаргах",
      },
    ],
  },
  {
    title: "6-р үе шат — байршуулалтын бэлэн байдал",
    items: [
      {
        label: "Байршуулалтын шалгалтын хуудас (/deployment-check)",
        status: "ready",
        href: "/deployment-check",
      },
      {
        label: "Системийн шалгалтын хуудас (/admin/system-check)",
        status: "ready",
        href: "/admin/system-check",
      },
      {
        label: "Чанарын шалгалтын хуудас (/admin/production-qa)",
        status: "ready",
        href: "/admin/production-qa",
      },
      {
        label: "Аюулгүй байдлын үзлэгийн хуудас (/admin/security-audit)",
        status: "ready",
        href: "/admin/security-audit",
      },
      {
        label: "Vercel-ийн орчны хувьсагч тохируулсан (URL + anon key)",
        status: "needs check",
        href: "/admin/system-check",
        note: "Байршуулсны дараа ажлын орчинд шалгана",
      },
      {
        label: "Supabase Auth-ийн Site URL ба Redirect URL",
        status: "needs check",
        note: "https://baldansan.vercel.app-д тохируулна",
      },
      {
        label: "Ажлын орчныг шалгах SQL",
        status: "needs check",
        note: "supabase/verify/production_verification.sql",
      },
      {
        label: "Байршуулалтын баримт (DEPLOYMENT_PLAN.md)",
        status: "ready",
        note: "6-р үе шатны 1–5 алхам",
      },
    ],
  },
  {
    title: "Аюулгүй байдал",
    items: [
      { label: ".env.local файл git-д ороогүй", status: "ready" },
      { label: "Клиент код дотор service_role байхгүй", status: "ready" },
      { label: "Репод нууц түлхүүр байхгүй", status: "ready" },
      {
        label: "Ажлын Supabase дээр RLS идэвхжсэн",
        status: "needs check",
        note: "6-р үе шатны байршуулалтаас өмнө шалгана",
      },
    ],
  },
];

function statusClass(status: AuditStatus): string {
  if (status === "ready") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (status === "needs check") {
    return "bg-amber-50 text-amber-900 ring-amber-200";
  }
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function FinalAuditChecklist() {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100">
        <h2 className="text-base font-semibold text-slate-900">
          5-р үе шатны эцсийн үзлэг — 2026 оны 5 сар
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Кодын үзлэг дууслаа. <strong>needs check</strong> гэж тэмдэглэсэн
          зүйлсийг та Supabase төсөл дээрээ гараар шалгана (migration, RLS,
          файл хадгалалт). Үйлдлийн бүртгэлийг бичихдээ ч уншихдаа ч хөтөч
          дээр нэвтэрсэн админы эрхийг ашиглана.
        </p>
      </section>

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {section.items.map((item) => (
              <li
                key={item.label}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${statusClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="text-sm font-medium text-slate-900 hover:text-emerald-700"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-slate-900">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {item.note ? (
                    <p className="text-xs text-slate-500">{item.note}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100">
        <h2 className="text-base font-semibold text-slate-900">Дараагийн алхам — 6-р үе шат</h2>
        <p className="mt-2 text-sm text-slate-700">
          1–5 алхам дууссан. Гаргахын өмнө{" "}
          <Link href="/admin/security-audit" className="font-medium text-emerald-800 hover:underline">
            Аюулгүй байдал / RLS үзлэг
          </Link>{" "}
          болон{" "}
          <Link href="/admin/production-qa" className="font-medium text-emerald-800 hover:underline">
            Чанарын шалгалтыг
          </Link>{" "}
          ажиллуулна уу.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/security-audit"
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Аюулгүй байдлын үзлэг
          </Link>
          <Link
            href="/admin/production-qa"
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Чанарын шалгалт
          </Link>
          <Link
            href="/admin/system-check"
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Системийн шалгалт
          </Link>
          <Link
            href="/admin"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Хяналтын самбар
          </Link>
          <Link
            href="/admin/activity"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Үйлдлийн бүртгэл
          </Link>
          <Link
            href="/admin/launch-candidate"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Гаргахад бэлтгэсэн хувилбар
          </Link>
          <Link
            href="/admin/launch-signoff"
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Гаргалтын баталгаа
          </Link>
          <Link
            href="/courses/hsk5"
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
          >
            Нийтийн курс
          </Link>
        </div>
      </section>
    </div>
  );
}
