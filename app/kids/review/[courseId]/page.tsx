import { notFound } from "next/navigation";
import { KidsReviewClient } from "@/components/kids/kids-review-client";
import type { KidsWord } from "@/lib/kids/lesson-data";
import { coursePath } from "@/lib/content";
import { courseSeriesMeta } from "@/lib/lesson/course-series-label";
import { createAnonServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ courseId: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { courseId } = await params;
  return { title: `Номын том шалгалт — ${courseSeriesMeta(courseId)?.title ?? courseId} | Бөөндөө Сурцгаая` };
}

/** Номын том шалгалт — /kids/review/yct-N: тухайн номын нийтлэгдсэн хичээлүүдийн бүх үгээр тоглоно. */
export default async function KidsReviewPage({ params }: PageProps) {
  const { courseId: raw } = await params;
  const courseId = raw.toLowerCase();
  if (!/^yct-[1-6]$/.test(courseId)) notFound();
  const client = createAnonServerSupabaseClient();
  if (!client) notFound();

  const { data: lessons } = await client.from("lessons").select("id").eq("course_id", courseId).eq("status", "available");
  const ids = (lessons ?? []).map((l: { id: string }) => l.id);
  if (!ids.length) notFound();

  const { data: rows } = await client
    .from("vocabulary_words")
    .select("chinese, pinyin, mongolian, lesson_id, order_index")
    .in("lesson_id", ids)
    .order("lesson_id")
    .order("order_index");

  const seen = new Set<string>();
  const words: KidsWord[] = [];
  for (const r of (rows ?? []) as { chinese: string; pinyin: string; mongolian: string }[]) {
    const zh = String(r.chinese ?? "").trim();
    const mn = String(r.mongolian ?? "").trim();
    if (!zh || !mn || seen.has(zh)) continue;
    seen.add(zh);
    words.push({ zh, pinyin: String(r.pinyin ?? "").trim(), mn, imageUrl: null, audioUrl: null });
  }
  if (words.length < 8) notFound();

  return <KidsReviewClient courseId={courseId} title={courseSeriesMeta(courseId)?.title ?? courseId} words={words} backHref={coursePath(courseId)} />;
}
