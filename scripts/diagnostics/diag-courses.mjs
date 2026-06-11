/**
 * One-off: list HSK courses/lessons in Supabase (local diagnostics).
 * Run: npm run diag:courses
 */
import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  if (!existsSync(".env.local")) return {};
  const env = {};
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.log("NO_ENV");
  process.exit(0);
}

const sb = createClient(url, key);

const { data: courses } = await sb
  .from("courses")
  .select("id,title,level,status,order_index")
  .or("id.ilike.hsk%,id.eq.hsk")
  .order("order_index");
console.log("=== COURSES ===");
console.log(JSON.stringify(courses, null, 2));

for (const level of ["hsk4", "hsk5", "hsk6", "hsk4a", "hsk4b", "hsk5a", "hsk5b"]) {
  const { data: lessons, count } = await sb
    .from("lessons")
    .select("id,course_id,status,order_index,title,source_note", { count: "exact" })
    .eq("course_id", level)
    .order("order_index");
  if ((count ?? 0) > 0) {
    console.log(`\n=== LESSONS course_id=${level} count=${count} ===`);
    console.log(
      lessons?.map((l) => ({
        id: l.id,
        order_index: l.order_index,
        status: l.status,
        title: (l.title ?? "").slice(0, 40),
      }))
    );
  }
}

const { data: allHskLessons } = await sb
  .from("lessons")
  .select("id,course_id,order_index,status")
  .or("id.ilike.hsk4-%,id.ilike.hsk5-%,id.ilike.hsk6-%")
  .order("course_id")
  .order("order_index");

const byCourse = {};
for (const l of allHskLessons ?? []) {
  byCourse[l.course_id] = byCourse[l.course_id] ?? [];
  byCourse[l.course_id].push(l);
}
console.log("\n=== SUMMARY BY course_id (hsk4/5/6 lesson ids) ===");
for (const [cid, rows] of Object.entries(byCourse)) {
  console.log(cid, rows.length, rows.map((r) => r.id).join(", "));
}

const { count: progCount } = await sb
  .from("user_lesson_progress")
  .select("id", { count: "exact", head: true });
console.log("\nuser_lesson_progress total rows:", progCount);
