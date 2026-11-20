/**
 * xinhsk3 багцуудыг (zip) /admin/import/chinese-ийн parser-ээр шалгаад
 * POST /api/admin/import/lesson-д явуулах JSON body болгоно.
 *   npx tsx scripts/xinhsk3/build-import-bodies.mts content/xinhsk3-packages/xinhsk3-l01.zip ... > out dir public/_imp/
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parseChineseLessonZip } from "@/lib/import/chinese-lesson-zip-import";
import { buildImportDraftApiBody } from "@/lib/admin/build-import-draft-request";

(globalThis as unknown as { window: unknown }).window = globalThis;

const outDir = process.env.OUT_DIR ?? "public/_imp";
mkdirSync(outDir, { recursive: true });
let failed = 0;
for (const path of process.argv.slice(2)) {
  const buf = readFileSync(path);
  const file = new File([buf], basename(path), { type: "application/zip" });
  const res = await parseChineseLessonZip(file);
  if (res.errors.length) {
    console.error(basename(path), "ERRORS:", res.errors);
    failed++;
    continue;
  }
  const body = buildImportDraftApiBody(res, { importTrack: "chinese", allowAutoCreateCourse: true });
  if (!body) {
    console.error(basename(path), "no body");
    failed++;
    continue;
  }
  const out = join(outDir, basename(path).replace(/\.zip$/, ".json"));
  writeFileSync(out, JSON.stringify(body));
  console.log(basename(path), "ok", "warnings:", res.warnings.length, "→", out, Math.round(JSON.stringify(body).length / 1024) + "KB");
}
process.exit(failed ? 2 : 0);
