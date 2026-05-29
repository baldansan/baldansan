import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-slate-600">Loading…</p>}>
      <SignupForm />
    </Suspense>
  );
}
