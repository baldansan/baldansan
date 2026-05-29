"use client";

import { FeedbackForm } from "@/components/feedback-form";
import { PublicPageShell } from "@/components/public-page-shell";

export function FeedbackPageClient() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Санал хүсэлт
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Одоогоор feedback form backend-д хадгалахгүй. Доорх template-г copy
          хийгээд admin/developer рүү явуулж болно.
        </p>
      </section>
      <FeedbackForm />
    </PublicPageShell>
  );
}
