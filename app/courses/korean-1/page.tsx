import { redirect } from "next/navigation";

/** Солонгос хэлний курсийг хассан (2026-11-18) — апп зөвхөн хятад хэлд төвлөрнө. */
export default function KoreanCourseRemovedPage() {
  redirect("/home");
}
