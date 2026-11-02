/** Build public invite URL for a token */
import { SITE_URL } from "@/lib/site-url";

export function buildInviteUrl(token: string, baseUrl?: string): string {
  const origin =
    baseUrl ??
    (typeof window !== "undefined" ? window.location.origin : SITE_URL);
  return `${origin.replace(/\/$/, "")}/invite/${encodeURIComponent(token)}`;
}
