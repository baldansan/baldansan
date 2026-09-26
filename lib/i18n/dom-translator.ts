/**
 * Runtime UI орчуулагч: DOM дахь монгол UI текстийг хятад руу газар дээр нь солино.
 *
 * Яагаад DOM түвшинд вэ: 700+ файлын товч/гарчиг/тайлбарыг нэг дор хамрах;
 * код өөрчлөгдөхгүй; хичээлийн КОНТЕНТ (`translate="no"` дотор, эсвэл толинд
 * байхгүй мөр) хөндөгдөхгүй. Текст node-ийн `data`-г л өөрчилдөг (node солихгүй)
 * тул React-ийн reconciliation эвдэрдэггүй.
 *
 * Дараалал: `tr()`-ээр render үедээ орчуулагдсан текст энд ирэхэд аль хэдийн
 * хятад тул толинд таарахгүй — давхар орчуулагдахгүй.
 */
import { ZH_UI } from "./translate";
import { ZH_UI_AUTO, ZH_UI_TEMPLATES } from "./zh-ui-auto";

const CYR = /[А-Яа-яӨөҮүЁё]/;

let STATIC: Map<string, string> | null = null;
let PATTERNS: Array<{ re: RegExp; out: string }> | null = null;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildTables() {
  if (STATIC) return;
  STATIC = new Map<string, string>();
  for (const [k, v] of Object.entries(ZH_UI_AUTO)) STATIC.set(k, v);
  // Гараар бичсэн ZH_UI давуу
  for (const [k, v] of Object.entries(ZH_UI)) STATIC.set(k, v);
  PATTERNS = [];
  for (const [mn, zh] of ZH_UI_TEMPLATES) {
    // "{0}" → capture group; бусад тэмдэгтийг escape
    const parts = mn.split(/\{(\d+)\}/);
    let re = "^";
    const order: number[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) re += escapeRe(parts[i]);
      else {
        order.push(Number(parts[i]));
        re += "([\\s\\S]*?)";
      }
    }
    re += "$";
    // zh дотор {n} → $k (n дугаартай бүлгийн дарааллаар)
    const out = zh.replace(/\{(\d+)\}/g, (_, n) => {
      const idx = order.indexOf(Number(n));
      return idx >= 0 ? `$${idx + 1}` : "";
    });
    try {
      PATTERNS.push({ re: new RegExp(re), out });
    } catch {
      // алгас
    }
  }
}

/** Нэг мөрийг орчуулна; орчуулга байхгүй бол null. Захын хоосон зайг хадгална. */
export function translateUiString(s: string): string | null {
  if (!s || !CYR.test(s)) return null;
  buildTables();
  const lead = s.match(/^\s*/)![0];
  const trail = s.match(/\s*$/)![0];
  const core = s.slice(lead.length, s.length - trail.length);
  if (!core) return null;
  const hit = STATIC!.get(core);
  if (hit !== undefined) return lead + hit + trail;
  for (const p of PATTERNS!) {
    if (p.re.test(core)) return lead + core.replace(p.re, p.out) + trail;
  }
  return null;
}

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CODE", "PRE", "NOSCRIPT", "SELECT", "OPTION"]);
const ATTRS = ["placeholder", "title", "aria-label", "alt", "data-tip"] as const;

function isSkipped(el: Element | null): boolean {
  let e: Element | null = el;
  while (e) {
    if (SKIP_TAGS.has(e.tagName)) return true;
    if (e.getAttribute("translate") === "no" || e.classList.contains("notranslate")) return true;
    if (e.hasAttribute("contenteditable")) return true;
    e = e.parentElement;
  }
  return false;
}

/** Бидний хамгийн сүүлд бичсэн утга — өөрсдийн mutation-г React-ийнхээс ялгана. */
const lastText = new WeakMap<Text, string>();
const lastAttr = new WeakMap<Element, Record<string, string>>();

function translateTextNode(node: Text) {
  const cur = node.data;
  if (lastText.get(node) === cur) return; // бидний бичсэн
  if (!CYR.test(cur)) return;
  if (isSkipped(node.parentElement)) return;
  const out = translateUiString(cur);
  if (out !== null && out !== cur) {
    lastText.set(node, out);
    node.data = out;
  }
}

function translateAttrs(el: Element) {
  if (isSkipped(el)) return;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v === null || !CYR.test(v)) continue;
    const rec = lastAttr.get(el);
    if (rec && rec[a] === v) continue;
    const out = translateUiString(v);
    if (out !== null && out !== v) {
      const next = rec ?? {};
      next[a] = out;
      lastAttr.set(el, next);
      el.setAttribute(a, out);
    }
  }
  // <input type=submit|button value="…">, <option> текст
  if (el instanceof HTMLInputElement && (el.type === "submit" || el.type === "button") && CYR.test(el.value)) {
    const out = translateUiString(el.value);
    if (out !== null) el.value = out;
  }
  if (el instanceof HTMLOptionElement && CYR.test(el.text)) {
    const out = translateUiString(el.text);
    if (out !== null && out !== el.text) el.text = out;
  }
}

function translateSubtree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) {
    const el = root as Element;
    if (SKIP_TAGS.has(el.tagName) && el.tagName !== "SELECT") {
      // input: placeholder/value орчуулна, дотор текстгүй
      translateAttrs(el);
      return;
    }
    translateAttrs(el);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n: Node | null = walker.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) translateTextNode(n as Text);
    else translateAttrs(n as Element);
    n = walker.nextNode();
  }
}

let observer: MutationObserver | null = null;

/** Бүх хуудсыг орчуулаад дараагийн өөрчлөлтийг ажиглана. Буцаах функц өгнө. */
export function startDomTranslator(): () => void {
  if (typeof document === "undefined") return () => {};
  buildTables();
  translateSubtree(document.documentElement);
  if (observer) observer.disconnect();
  observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "characterData") {
        translateTextNode(r.target as Text);
      } else if (r.type === "childList") {
        r.addedNodes.forEach((n) => translateSubtree(n));
      } else if (r.type === "attributes" && r.target.nodeType === Node.ELEMENT_NODE) {
        translateAttrs(r.target as Element);
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS, "value"],
  });
  return () => {
    observer?.disconnect();
    observer = null;
  };
}
