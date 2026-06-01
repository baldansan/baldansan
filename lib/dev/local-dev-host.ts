/** Host detection for local dev, LAN testing, and service-worker bypass. */

export function isPrivateNetworkHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
    return true;
  }
  if (host.endsWith(".local")) {
    return true;
  }
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  const match = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (match) {
    const second = Number(match[1]);
    if (second >= 16 && second <= 31) {
      return true;
    }
  }
  return false;
}

export function isLocalDevHost(hostname: string): boolean {
  return isPrivateNetworkHost(hostname);
}

export function shouldDisableServiceWorker(options?: {
  nodeEnv?: string;
  hostname?: string;
  pathname?: string;
}): boolean {
  const nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV;
  if (nodeEnv === "development" || nodeEnv === "test") {
    return true;
  }

  const hostname = options?.hostname;
  if (hostname && isLocalDevHost(hostname)) {
    return true;
  }

  const pathname = options?.pathname;
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/debug")) {
    return true;
  }

  return false;
}
