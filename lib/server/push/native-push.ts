import "server-only";

import { createSign, sign as cryptoSign } from "node:crypto";
import http2 from "node:http2";

export type NativePayload = { title: string; body: string; url?: string };
export type NativeSendResult = { ok: boolean; gone?: boolean; error?: string };

/* ------------------------------------------------------------------ */
/* Android — Firebase Cloud Messaging (HTTP v1)                         */
/* ------------------------------------------------------------------ */

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const json = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!json.project_id || !json.client_email || !json.private_key) return null;
    return {
      project_id: json.project_id,
      client_email: json.client_email,
      private_key: json.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

export function isFcmConfigured(): boolean {
  return readServiceAccount() !== null;
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

let fcmToken: { value: string; expiresAt: number } | null = null;

async function getFcmAccessToken(sa: ServiceAccount): Promise<string | null> {
  const nowSec = Math.floor(Date.now() / 1000);
  if (fcmToken && fcmToken.expiresAt > nowSec + 60) return fcmToken.value;
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 3600,
    })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const assertion = `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  fcmToken = { value: json.access_token, expiresAt: nowSec + (json.expires_in ?? 3600) };
  return fcmToken.value;
}

export async function sendFcm(token: string, payload: NativePayload): Promise<NativeSendResult> {
  const sa = readServiceAccount();
  if (!sa) return { ok: false, error: "FCM not configured" };
  try {
    const access = await getFcmAccessToken(sa);
    if (!access) return { ok: false, error: "FCM auth failed" };
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: payload.title, body: payload.body },
            data: { url: payload.url ?? "/home" },
            android: { priority: "HIGH" },
          },
        }),
      }
    );
    if (res.ok) return { ok: true };
    const text = await res.text();
    return {
      ok: false,
      gone: res.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(text),
      error: `FCM ${res.status}`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "FCM error" };
  }
}

/* ------------------------------------------------------------------ */
/* iOS — Apple Push Notification service (HTTP/2, token auth)           */
/* ------------------------------------------------------------------ */

type ApnsConfig = { key: string; keyId: string; teamId: string; bundleId: string; host: string };

function readApns(): ApnsConfig | null {
  const key = process.env.APNS_KEY_P8?.trim().replace(/\\n/g, "\n");
  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  if (!key || !keyId || !teamId) return null;
  return {
    key,
    keyId,
    teamId,
    bundleId: process.env.APNS_BUNDLE_ID?.trim() || "mn.buunduu.surtsgaay",
    host:
      process.env.APNS_SANDBOX === "1"
        ? "https://api.sandbox.push.apple.com"
        : "https://api.push.apple.com",
  };
}

export function isApnsConfigured(): boolean {
  return readApns() !== null;
}

let apnsJwt: { value: string; issuedAt: number } | null = null;

function getApnsJwt(cfg: ApnsConfig): string {
  const nowSec = Math.floor(Date.now() / 1000);
  // Apple: token-ийг 20–60 минут тутам л шинэчилнэ.
  if (apnsJwt && nowSec - apnsJwt.issuedAt < 40 * 60) return apnsJwt.value;
  const header = b64url(JSON.stringify({ alg: "ES256", kid: cfg.keyId }));
  const claims = b64url(JSON.stringify({ iss: cfg.teamId, iat: nowSec }));
  const signature = cryptoSign("sha256", Buffer.from(`${header}.${claims}`), {
    key: cfg.key,
    dsaEncoding: "ieee-p1363",
  });
  apnsJwt = { value: `${header}.${claims}.${b64url(signature)}`, issuedAt: nowSec };
  return apnsJwt.value;
}

export async function sendApns(token: string, payload: NativePayload): Promise<NativeSendResult> {
  const cfg = readApns();
  if (!cfg) return { ok: false, error: "APNs not configured" };
  return new Promise<NativeSendResult>((resolve) => {
    let settled = false;
    const finish = (r: NativeSendResult) => {
      if (settled) return;
      settled = true;
      try {
        client.close();
      } catch {
        /* ignore */
      }
      resolve(r);
    };
    const client = http2.connect(cfg.host);
    client.on("error", (e) => finish({ ok: false, error: e.message }));
    const timer = setTimeout(() => finish({ ok: false, error: "APNs timeout" }), 8000);
    try {
      const req = client.request({
        ":method": "POST",
        ":path": `/3/device/${token}`,
        authorization: `bearer ${getApnsJwt(cfg)}`,
        "apns-topic": cfg.bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      });
      let status = 0;
      let body = "";
      req.on("response", (headers) => {
        status = Number(headers[":status"] ?? 0);
      });
      req.setEncoding("utf8");
      req.on("data", (chunk: string) => {
        body += chunk;
      });
      req.on("end", () => {
        clearTimeout(timer);
        if (status === 200) finish({ ok: true });
        else
          finish({
            ok: false,
            gone: status === 410 || /BadDeviceToken|Unregistered/.test(body),
            error: `APNs ${status} ${body.slice(0, 80)}`,
          });
      });
      req.on("error", (e) => {
        clearTimeout(timer);
        finish({ ok: false, error: e.message });
      });
      req.end(
        JSON.stringify({
          aps: { alert: { title: payload.title, body: payload.body }, sound: "default" },
          url: payload.url ?? "/home",
        })
      );
    } catch (e) {
      clearTimeout(timer);
      finish({ ok: false, error: e instanceof Error ? e.message : "APNs error" });
    }
  });
}
