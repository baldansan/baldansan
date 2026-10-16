/**
 * OpenAI-compatible chat provider (сервер дээр л ашиглана).
 *
 * env:
 *   AI_API_KEY   — байхгүй бол provider идэвхгүй → клиент scripted fallback ашиглана
 *   AI_BASE_URL  — default https://api.openai.com/v1 (DeepSeek: https://api.deepseek.com/v1)
 *   AI_MODEL     — default gpt-4o-mini (DeepSeek: deepseek-chat)
 */

export type ChatRole = "system" | "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

export type ChatCompleteOptions = {
  /** JSON object mode (OpenAI `response_format`) */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type ChatCompleteResult =
  | { ok: true; content: string; model: string }
  | { ok: false; error: string; status?: number };

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function hasAiProvider(): boolean {
  return env("AI_API_KEY").length > 0;
}

export function aiModelName(): string {
  return env("AI_MODEL") || "gpt-4o-mini";
}

function baseUrl(): string {
  return (env("AI_BASE_URL") || "https://api.openai.com/v1").replace(/\/+$/, "");
}

export async function chatComplete(
  messages: ChatMessage[],
  opts: ChatCompleteOptions = {}
): Promise<ChatCompleteResult> {
  const key = env("AI_API_KEY");
  if (!key) return { ok: false, error: "AI_API_KEY тохируулаагүй", status: 503 };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25_000);
  try {
    const body: Record<string, unknown> = {
      model: aiModelName(),
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 400,
    };
    if (opts.json) body.response_format = { type: "json_object" };

    const res = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `AI provider ${res.status}: ${text.slice(0, 200)}`, status: res.status };
    }
    const data = (await res.json()) as {
      model?: string;
      choices?: { message?: { content?: string | null } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) return { ok: false, error: "AI хоосон хариу буцаалаа" };
    return { ok: true, content, model: data.model ?? aiModelName() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: controller.signal.aborted ? "AI хариу хэт удаан (timeout)" : msg };
  } finally {
    clearTimeout(timer);
  }
}

/** ```json ... ``` хашилттай ч байсан JSON объект гаргаж авна. */
export function parseJsonObject<T = Record<string, unknown>>(raw: string): T | null {
  const trimmed = raw.trim();
  const candidates = [trimmed];
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) candidates.unshift(fence[1].trim());
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(trimmed.slice(first, last + 1));
  for (const c of candidates) {
    try {
      const v = JSON.parse(c);
      if (v && typeof v === "object") return v as T;
    } catch {
      /* дараагийнх */
    }
  }
  return null;
}
