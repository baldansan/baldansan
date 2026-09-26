// UI-д харагдах монгол мөрүүдийг TS/TSX-ээс AST-аар задлан авна.
// Гаралт: scripts/i18n/out/strings.json — { static: [...], templates: [{pattern, parts}] , byFile }
// Хэрэглээ: node scripts/i18n/extract-ui-strings.mjs
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const CYR = /[А-Яа-яӨөҮүЁё]/;

const INCLUDE_DIRS = ["app", "components", "hooks", "lib", "data", "types"];
const EXCLUDE = [
  "lib/i18n/",
  "lib/lesson/",
  "lib/quiz/",
  "lib/content/",
  "lib/baljmaa-content.ts",
  "lib/demo-data.ts",
  "lib/hanzi/",
  "lib/helzui/",
  "lib/hsk30-durem/",
  "lib/hsk1-audit/",
  "data/",
  "app/api/",
  "components/dev/",
  "lib/dev/",
  ".test.",
  ".spec.",
  "__tests__",
];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      walk(p, out);
    } else if (/\.(tsx?|mjs)$/.test(e.name) && !e.name.endsWith(".d.ts")) {
      out.push(p);
    }
  }
}

const files = [];
for (const d of INCLUDE_DIRS) {
  const abs = path.join(ROOT, d);
  if (fs.existsSync(abs)) walk(abs, files);
}

const statics = new Map(); // text -> Set(files)
const templates = new Map(); // pattern -> {parts, files}
const attrOnly = new Set();

function norm(s) {
  return s.replace(/\s+/g, " ").trim();
}
function add(map, key, file) {
  if (!key || !CYR.test(key)) return;
  if (key.length > 400) return;
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(file);
}

for (const file of files) {
  const rel = path.relative(ROOT, file);
  if (EXCLUDE.some((x) => rel.includes(x))) continue;
  const src = fs.readFileSync(file, "utf8");
  if (!CYR.test(src)) continue;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, rel.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isJsxText(node)) {
      // JSX text: whole trimmed text is one key (React renders it as one text node)
      add(statics, norm(node.getText()), rel);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      // skip import specifiers / property names used as object keys in translate dicts
      const p = node.parent;
      if (p && (ts.isImportDeclaration(p) || ts.isExportDeclaration(p))) return;
      if (p && ts.isPropertyAssignment(p) && p.name === node) return; // object key
      add(statics, norm(node.text), rel);
      if (p && ts.isJsxAttribute(p)) attrOnly.add(norm(node.text));
    } else if (ts.isTemplateExpression(node)) {
      const parts = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)];
      if (parts.some((t) => CYR.test(t))) {
        // pattern: static parts joined by {n}
        const pattern = parts.map((t, i) => (i === 0 ? t : `{${i - 1}}` + t)).join("");
        const key = norm(pattern);
        if (!templates.has(key)) templates.set(key, { parts: parts.map(norm), files: new Set() });
        templates.get(key).files.add(rel);
      }
      // still visit spans for nested literals
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const outDir = path.join(ROOT, "scripts/i18n/out");
fs.mkdirSync(outDir, { recursive: true });
const staticList = [...statics.entries()].map(([text, f]) => ({ text, files: [...f] }));
const templateList = [...templates.entries()].map(([pattern, v]) => ({ pattern, files: [...v.files] }));
fs.writeFileSync(
  path.join(outDir, "strings.json"),
  JSON.stringify({ static: staticList, templates: templateList }, null, 1)
);
console.log(`files scanned: ${files.length}, static strings: ${staticList.length}, templates: ${templateList.length}`);
