import { SchoolInquiryForm } from "@/components/b2b/school-inquiry-form";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata = {
  title: "School inquiry — Бөөндөө Сурцгаая",
  description:
    "Сургалтын төв, сургууль, багш нарт зориулсан Хятад хэлний platform-ийн inquiry form.",
};

export default function SchoolInquiryPage() {
  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          School / B2B inquiry
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Сургалтын төв, сургууль, багш нар platform-ийн demo, package,
          onboarding-ийн талаар холбогдох. Inquiry admin CRM руу илгээгдэнэ.
        </p>
      </section>
      <SchoolInquiryForm />
    </PublicPageShell>
  );
}
