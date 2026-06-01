export function authDevLog(message: string, details?: unknown): void {
  if (process.env.NODE_ENV !== "development") return;
  if (details === undefined) {
    console.log(`[auth] ${message}`);
    return;
  }
  console.log(`[auth] ${message}`, details);
}
