import { Suspense } from "react";
import { TeacherCertificateView } from "@/components/teacher/teacher-certificate-view";

export const metadata = {
  title: "Гэрчилгээ — Багш",
};

export default function TeacherCertificatePage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-slate-600">Ачаалж байна…</p>}>
      <TeacherCertificateView />
    </Suspense>
  );
}
