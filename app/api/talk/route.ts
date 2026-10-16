// app/api/talk/route.ts — AI ролийн яриа (OpenAI-compatible provider).
// GET  → { ai: boolean }  (түлхүүр байгаа эсэх; байхгүй бол клиент scripted fallback)
// POST → { scenarioId, messages:[{role:"ai"|"user", zh}] } → TalkApiReply JSON
import { NextResponse } from "next/server";
import { chatComplete, hasAiProvider, parseJsonObject, type ChatMessage } from "@/lib/ai/chat-provider";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";
import { getTalkScenario } from "@/lib/talk/scenarios";
import type { TalkApiReply } from "@/lib/talk/types";

export const dynamic = "force-dynamic";

/** Энгийн rate limit: хэрэглэгч бүр минутад 20 хүсэлт (нэг instance дотор). */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const hits = new Map<string, number[]>();
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (hits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    hits.set(userId, arr);
    return true;
  }
  arr.push(now);
  hits.set(userId, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

const MAX_HISTORY = 16;
const MAX_USER_CHARS = 200;

export async function GET() {
  return NextResponse.json({ ai: hasAiProvider() });
}

export async function POST(request: Request) {
  if (!hasAiProvider()) {
    return NextResponse.json({ ok: false, fallback: true, message: "AI тохируулаагүй" }, { status: 503 });
  }
  if (!hasServerSupabaseConfig) {
    return NextResponse.json({ ok: false, message: "Supabase тохируулагдаагүй." }, { status: 503 });
  }
  const client = await createServerSupabaseClient();
  const { data: auth } = (await client?.auth.getUser()) ?? { data: { user: null } };
  const userId = auth.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "Нэвтэрсэн байх шаардлагатай." }, { status: 401 });
  }
  if (rateLimited(userId)) {
    return NextResponse.json({ ok: false, message: "Хэт олон хүсэлт — 1 минут хүлээгээрэй." }, { status: 429 });
  }

  let body: { scenarioId?: string; messages?: { role?: string; zh?: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Буруу хүсэлт." }, { status: 400 });
  }
  const scenario = getTalkScenario(body.scenarioId);
  if (!scenario) {
    return NextResponse.json({ ok: false, message: "Сценар олдсонгүй." }, { status: 404 });
  }
  const history = (body.messages ?? [])
    .filter((m) => (m.role === "ai" || m.role === "user") && typeof m.zh === "string" && m.zh.trim())
    .slice(-MAX_HISTORY)
    .map<ChatMessage>((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.zh!.trim().slice(0, MAX_USER_CHARS),
    }));

  const turn = history.filter((m) => m.role === "user").length;
  const system = [
    `你是一个汉语口语陪练。场景：${scenario.setting_zh}`,
    `你的角色：${scenario.ai_role_zh}。${scenario.ai_context}`,
    `学生水平：${scenario.level}（初级）。只用该级别的常用词和简单句子，每次回复不超过 25 个汉字，一次只问一个问题。`,
    "如果学生的句子有明显错误，先给出温和的纠正（correction），再继续对话；小错误不必纠正。",
    "学生用蒙古语或英语回答时，用简单汉语鼓励他用汉语说，并给一个例句。",
    `对话进行 6–8 轮后自然结束（说再见），并把 done 设为 true。当前是第 ${turn} 轮。`,
    "严格只输出 JSON 对象，不要任何其他文字：",
    '{"zh":"你的中文回复","pinyin":"带声调的拼音","mn":"蒙古语（西里尔）翻译","correction":{"zh":"更自然的说法","mn":"蒙古语说明"} 或 null,"done":false}',
  ].join("\n");

  const messages: ChatMessage[] = [{ role: "system", content: system }, ...history];
  if (history.length === 0 || history[history.length - 1]!.role === "assistant") {
    messages.push({ role: "user", content: "（请开始对话，先打招呼并提一个问题。）" });
  }

  const result = await chatComplete(messages, { json: true, temperature: 0.7, maxTokens: 350 });
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.error }, { status: result.status === 503 ? 503 : 502 });
  }
  const parsed = parseJsonObject<Partial<TalkApiReply>>(result.content);
  if (!parsed || typeof parsed.zh !== "string" || !parsed.zh.trim()) {
    return NextResponse.json({ ok: false, message: "AI хариу уншигдсангүй." }, { status: 502 });
  }
  const reply: TalkApiReply = {
    zh: parsed.zh.trim(),
    pinyin: typeof parsed.pinyin === "string" ? parsed.pinyin.trim() : "",
    mn: typeof parsed.mn === "string" ? parsed.mn.trim() : "",
    correction:
      parsed.correction && typeof parsed.correction === "object" && typeof parsed.correction.zh === "string"
        ? { zh: parsed.correction.zh, mn: String(parsed.correction.mn ?? "") }
        : null,
    done: Boolean(parsed.done) || turn >= 10,
  };
  return NextResponse.json({ ok: true, reply, model: result.model });
}
