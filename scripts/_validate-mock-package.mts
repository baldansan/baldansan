import { readFileSync } from "node:fs";
import { validateMockPackage } from "@/lib/mock-test/import-package";
const file = process.argv[2];
const raw = JSON.parse(readFileSync(file, "utf8"));
const { pkg, report } = validateMockPackage(raw);
console.log(JSON.stringify({ ok: report.ok, errors: report.errors, warnings: report.warnings.slice(0, 40), nWarnings: report.warnings.length, stats: report.stats, assets: report.assetRefs.length }, null, 1));
process.exit(pkg ? 0 : 1);
