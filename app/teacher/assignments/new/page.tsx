import { Suspense } from "react";
import { NewAssignmentForm } from "./new-assignment-form";

export const metadata = {
  title: "Шинэ даалгавар — Багшийн dashboard",
  description: "Create assignment preview — classroom workflow.",
};

export default function NewAssignmentPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-slate-600">Loading…</p>}>
      <NewAssignmentForm />
    </Suspense>
  );
}
