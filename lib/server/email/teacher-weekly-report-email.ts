import "server-only";

import type { WeeklyTeacherReportData } from "@/lib/supabase/teacher-weekly-report-data";

export type SendWeeklyReportResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isWeeklyReportResendConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim()
  );
}

/** Энгийн HTML (markdown-ish, inline-style) долоо хоногийн тайлан имэйл бэлтгэх. */
export function buildWeeklyTeacherReportEmail(data: WeeklyTeacherReportData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Долоо хоногийн тайлан — ${data.teacherName} (${data.classCount} анги)`;

  const textLines = [
    `Сайн байна уу, ${data.teacherName}.`,
    "",
    `Энэ долоо хоногт нийт ${data.weeklyCompletedCount} даалгавар дуусгасан байна.`,
    `Анги: ${data.classCount}, Сурагч: ${data.totalStudents} (${data.totalInactiveStudents} идэвхгүй)`,
    `Дундаж оноо: ${data.averageQuizPercentage ?? "—"}%`,
    "",
  ];
  for (const c of data.classes) {
    textLines.push(
      `— ${c.name}: ${c.studentCount} сурагч, гүйцэтгэл ${c.completionRate}%, дундаж оноо ${
        c.averageQuizPercentage ?? "—"
      }%`
    );
    for (const note of c.needsAttention) {
      textLines.push(`   ⚠ ${note}`);
    }
  }

  const rows = data.classes
    .map(
      (c) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 10px;font-weight:600;color:#111827;">${escapeHtml(c.name)}</td>
          <td style="padding:8px 10px;text-align:center;">${c.studentCount}</td>
          <td style="padding:8px 10px;text-align:center;">${c.completionRate}%</td>
          <td style="padding:8px 10px;text-align:center;">${c.averageQuizPercentage ?? "—"}%</td>
          <td style="padding:8px 10px;color:#b45309;">${
            c.needsAttention.length > 0
              ? c.needsAttention.map((n) => escapeHtml(n)).join("<br/>")
              : "—"
          }</td>
        </tr>`
    )
    .join("");

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
    <h2 style="color:#047857;margin-bottom:4px;">📊 Долоо хоногийн тайлан</h2>
    <p style="margin-top:0;color:#6b7280;">Бөөндөө Сурцгаая — ${escapeHtml(data.teacherName)}</p>
    <p>Энэ долоо хоногт нийт <strong>${data.weeklyCompletedCount}</strong> даалгавар дуусгасан байна.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;">
      <tr style="background:#ecfdf5;text-align:left;">
        <th style="padding:8px 10px;">Анги</th>
        <th style="padding:8px 10px;">Сурагч</th>
        <th style="padding:8px 10px;">Гүйцэтгэл</th>
        <th style="padding:8px 10px;">Дундаж оноо</th>
        <th style="padding:8px 10px;">Анхаарах</th>
      </tr>
      ${rows}
    </table>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">
      Энэ тайланг тохиргоогоос унтраах боломжтой. — Бөөндөө Сурцгаая
    </p>
  </div>`;

  return { subject, html, text: textLines.join("\n") };
}

/**
 * Resend-ээр имэйл илгээх (npm `resend` package). RESEND_API_KEY/RESEND_FROM_EMAIL
 * тохируулаагүй бол лог бичээд graceful-degrade хийнэ — алдаа шидэхгүй
 * (AI_API_KEY байхгүй үеийн scripted-fallback-той адил логик).
 */
export async function sendWeeklyTeacherReportEmail(
  to: string,
  data: WeeklyTeacherReportData
): Promise<SendWeeklyReportResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    console.log(
      "[weekly-teacher-report] RESEND_API_KEY/RESEND_FROM_EMAIL тохируулаагүй тул алгаслаа:",
      to
    );
    return {
      ok: false,
      skipped: true,
      reason: "RESEND_API_KEY/RESEND_FROM_EMAIL not configured",
    };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { subject, html, text } = buildWeeklyTeacherReportEmail(data);

    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[weekly-teacher-report] Resend алдаа:", error);
      return { ok: false, error: error.message ?? "Resend send failed" };
    }

    return { ok: true };
  } catch (e) {
    console.error("[weekly-teacher-report] имэйл илгээхэд алдаа:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
