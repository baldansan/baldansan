import { LaunchCandidateView } from "@/components/admin/launch-candidate-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Гаргахад нэр дэвшсэн хувилбар — Удирдлагын хэсэг",
};

export default function AdminLaunchCandidatePage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Гаргахад нэр дэвшсэн хувилбар
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Шинэ хувилбар гаргахын өмнөх эцсийн туршилт, аюулгүй байдал, чанарын
          шалгалт, буцаалт, хяналтын шалгах жагсаалт.
        </p>
      </section>
      <LaunchCandidateView />
    </div>
  );
}
