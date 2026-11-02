"use client";

import { ReportIssueLink } from "@/components/feedback/report-issue-link";
import { PublicPageShell } from "@/components/public-page-shell";

export function FeedbackPageClient() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Санал хүсэлт</h1>
        <p className="mt-2 text-sm text-slate-600">
          Алдаа, буруу орчуулга, санал — доорх товчоор бичээд илгээнэ үү. Тэмдэглэл тань шууд
          админ руу очно (дэлгэцийн зураг автоматаар хавсарна).
        </p>
      </section>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <ReportIssueLink variant="inline" />
        <p className="mt-3 text-xs text-slate-500">
          Хичээл дотроос мэдээлэх бол дэлгэцийн баруун доод буланд байгаа 💬 товчийг дарна —
          тэгвэл аль хичээл, аль хуудас гэдэг нь автоматаар хавсарна.
        </p>
      </div>
    </PublicPageShell>
  );
}
