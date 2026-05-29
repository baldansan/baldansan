/** Build public invite URL for a token */

export function buildInviteUrl(token: string, baseUrl?: string): string {
  const origin =
    baseUrl ??
    (typeof window !== "undefined" ? window.location.origin : "https://baldansan.vercel.app");
  return `${origin.replace(/\/$/, "")}/invite/${encodeURIComponent(token)}`;
}
