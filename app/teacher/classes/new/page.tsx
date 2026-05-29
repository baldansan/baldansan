import { Suspense } from "react";
import { CreateClassForm } from "@/components/teacher/create-class-form";

export const metadata = {
  title: "Шинэ анги — Teacher",
  description: "Create a new classroom.",
};

export default function NewClassPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-slate-600">Loading…</p>}>
      <CreateClassForm />
    </Suspense>
  );
}
