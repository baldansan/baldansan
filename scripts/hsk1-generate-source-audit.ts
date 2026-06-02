/**
 * Generate HSK1 master source audit artifacts.
 * Run: npx tsx scripts/hsk1-generate-source-audit.ts
 */
import fs from "node:fs";
import path from "node:path";
import { generateAllAuditArtifacts } from "../lib/hsk1-audit/generate-audit";
import {
  formatBlockedReport,
  validateHsk1SourceAudit,
} from "../lib/hsk1-audit/validate-audit";

const ROOT = path.resolve(__dirname, "..");
const AUDIT_DIR = path.join(ROOT, "content/hsk1/source-audit");
const PROFILE_DIR = path.join(ROOT, "content/hsk1/lesson-profiles");

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function buildMasterIndexMd(
  masterIndex: ReturnType<typeof generateAllAuditArtifacts>["masterIndex"],
  validation: ReturnType<typeof validateHsk1SourceAudit>
): string {
  const lines = [
    "# HSK1 Master Source Index",
    "",
    `Generated: ${masterIndex.generatedAt}`,
    "",
    "## Principle",
    "",
    "Source content from HSK Standard Course 1 (textbook, teacher's book, workbook, answers, audio) is **mandatory**.",
    "App enrichment is optional and must not replace, omit, or contradict source.",
    "",
    "## Source files (expected upload set)",
    "",
    ...Object.entries(masterIndex.sourceFiles).map(
      ([k, v]) => `- **${k}**: \`${v}\``
    ),
    "",
    `**On disk in repo:** \`${masterIndex.sourceFilesOnDisk}\` — PDF/ZIP extraction pending.`,
    "",
    "## Invalid legacy packages (do not reuse)",
    "",
    ...masterIndex.invalidLegacyPackages.map(
      (p) =>
        `- Lesson ${p.lessonNumber}: \`${p.wrongChineseTitle}\` → must be \`${p.correctChineseTitle}\` — ${p.reason}`
    ),
    "",
    "## Acceptance gate",
    "",
    "| Criterion | Status |",
    "|-----------|--------|",
    `| textbookCoverage | ${masterIndex.acceptanceGate.textbookCoveragePercent}% |`,
    `| teacherBookCoverage | ${masterIndex.acceptanceGate.teacherBookCoveragePercent}% |`,
    `| workbookCoverage | ${masterIndex.acceptanceGate.workbookCoveragePercent}% |`,
    `| workbookAnswerCoverage | ${masterIndex.acceptanceGate.workbookAnswerCoveragePercent}% |`,
    `| audioCoverage | ${masterIndex.acceptanceGate.audioCoveragePercent}% |`,
    `| vocabularyCoverage | ${masterIndex.acceptanceGate.vocabularyCoveragePercent}% |`,
    `| characterCoverage | ${masterIndex.acceptanceGate.characterCoveragePercent}% |`,
    `| learnerFlowReviewed | ${masterIndex.acceptanceGate.learnerFlowReviewed} |`,
    `| gameLogicReviewed | ${masterIndex.acceptanceGate.gameLogicReviewed} |`,
    `| buildPasses | ${masterIndex.acceptanceGate.buildPasses} |`,
    "",
    validation.packagingBlocked
      ? `**${validation.blockReason}**`
      : "Packaging allowed.",
    "",
    "## Lesson order (canonical)",
    "",
    "| # | lessonId | 中文 | English | Status |",
    "|---|----------|------|---------|--------|",
    ...masterIndex.lessons.map(
      (l) =>
        `| ${l.lessonNumber} | \`${l.lessonId}\` | ${l.chineseTitle} | ${l.englishTitle} | ${l.sourceStatus} |`
    ),
    "",
    "## Next steps",
    "",
    "1. Place source PDFs/ZIPs in a controlled import folder (not committed if large).",
    "2. Run page-range confirmation pass — update `needs_manual_confirmation` fields.",
    "3. Extract audio inventories from both ZIP files.",
    "4. Mark coverage matrix rows PASS only after verified extraction.",
    "5. Re-run `npm run hsk1:audit:validate` until packaging gate opens.",
    "6. Then create V13 packages lesson-by-lesson starting with Lesson 1.",
    "",
  ];
  return lines.join("\n");
}

function buildExtractionReport(): string {
  return `# HSK1 Source Extraction Report

Generated as part of master audit bootstrap.

## Status: NOT STARTED (source PDFs/ZIPs not in repository)

### Required extraction pipeline

1. **Textbook PDF** (\`HSK-1-Textbook (1).pdf\`)
   - Per lesson: title, dialogues, English text, new words, pinyin, notes, characters, stroke order, culture
   - Record exact page numbers in master index

2. **Teacher's Book PDF** (\`HSK_Standard_Course_1_Teacher_39_s_Book.pdf\`)
   - Teaching goals, steps, pronunciation/character points, review, activities
   - Use internally for guided flow — never raw dump in learner UI

3. **Workbook PDF** (\`HSK-1-Workbook (1).pdf\`)
   - Sections 一–八 per lesson with full item lists
   - Page images as fallback when structured UI not ready

4. **Workbook answers PDF** (\`hsk1-workbook-answers (1).pdf\`)
   - Map answers to workbook sections 三–七 (and others where present)
   - Admin/review only

5. **Textbook audio ZIP** (\`hsk1textbookaudios.zip\`)
   - Full file inventory
   - Map to dialogues and pronunciation drills
   - \`startSec\`/\`endSec\` null unless verified

6. **Workbook audio ZIP** (\`hsk1workbookaudios.zip\`)
   - Map to listening exercises (typically sections 四–六)
   - Whole-exercise audio label when timestamps unknown

## Lesson 1 partial runtime overlay

The app already applies \`applyHsk1L01V13GoldStandard\` for \`hsk1-l01-nihao\`.
This is **enrichment**, not a substitute for PDF-backed source extraction.

Coverage matrix marks some L1 rows PASS with note: verify against PDF pages.

## Tooling

- Generate audit: \`npm run hsk1:audit:generate\`
- Validate gate: \`npm run hsk1:audit:validate\`
`;
}

function main() {
  const { masterIndex, matrices, profiles } = generateAllAuditArtifacts();
  const validation = validateHsk1SourceAudit({ masterIndex, matrices });

  writeJson(path.join(AUDIT_DIR, "hsk1-master-source-index.json"), masterIndex);
  fs.writeFileSync(
    path.join(AUDIT_DIR, "hsk1-master-source-index.md"),
    buildMasterIndexMd(masterIndex, validation),
    "utf8"
  );

  for (const matrix of matrices) {
    const pad = String(matrix.lessonNumber).padStart(2, "0");
    writeJson(
      path.join(AUDIT_DIR, `lesson-${pad}-coverage-matrix.json`),
      matrix
    );
  }

  for (const profile of profiles) {
    const pad = String(profile.lessonNumber).padStart(2, "0");
    writeJson(path.join(PROFILE_DIR, `lesson-${pad}-profile.json`), profile);
  }

  fs.writeFileSync(
    path.join(AUDIT_DIR, "source-extraction-report.md"),
    buildExtractionReport(),
    "utf8"
  );

  fs.writeFileSync(
    path.join(AUDIT_DIR, "missing-blocked-items-report.md"),
    formatBlockedReport(validation),
    "utf8"
  );

  console.log("HSK1 source audit generated.");
  console.log(`  Lessons: ${matrices.length}`);
  console.log(`  Packaging blocked: ${validation.packagingBlocked}`);
  if (validation.blockReason) console.log(`  ${validation.blockReason}`);
}

main();
