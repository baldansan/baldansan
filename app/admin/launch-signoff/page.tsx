import { LaunchSignoffView } from "@/components/admin/launch-signoff-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Гаргалтын баталгаа — Удирдлагын хэсэг",
};

export default function AdminLaunchSignoffPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Гаргалтын баталгаа
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Хэрэглэгчдэд нээхийн өмнөх эцсийн баталгаажуулалт, шийдвэр, хяналтын
          бэлэн байдал.
        </p>
      </section>
      <LaunchSignoffView />
    </div>
  );
}
