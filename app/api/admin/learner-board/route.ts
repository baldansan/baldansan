import { NextResponse } from "next/server";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { getLearnerGradeBoard } from "@/lib/supabase/admin-learner-grades";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** «Өнөөдөр» хуудсанд: апп ашиглаж буй бүх хүн (нэр, үнэлгээ, сүүлд орсон). Зөвхөн админд. */
export async function GET() {
  try {
    if (!(await isCurrentUserAdminServer())) {
      return NextResponse.json({ ok: false, rows: [] }, { status: 403 });
    }
    const board = await getLearnerGradeBoard();
    const rows = board.rows
      .filter((r) => !r.isDemo)
      .map((r) => ({
        userId: r.userId,
        displayName: r.displayName,
        email: r.email,
        grade: r.score.grade,
        completedLessons: r.completedLessons,
        learnedWords: r.learnedWords,
        activeMinutes: r.activeMinutes,
        lastActiveAt: r.lastActiveAt,
      }));
    return NextResponse.json(
      { ok: true, rows },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, rows: [], reason: error instanceof Error ? error.message : "error" },
      { status: 500 }
    );
  }
}
