import { Suspense } from "react";
import { AssignmentWizard } from "@/components/teacher/assignment-wizard";

export const metadata = {
  title: "Даалгавар өгөх — Багш",
};

export default function NewAssignmentPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-slate-600">Ачаалж байна…</p>}>
      <AssignmentWizard />
    </Suspense>
  );
}
