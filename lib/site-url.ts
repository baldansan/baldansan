/**
 * Сайтын нэг мөр домэйн. Vercel дээр NEXT_PUBLIC_SITE_URL-ээр дарж болно.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://surtsgaay.buunduu.mn"
).replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
