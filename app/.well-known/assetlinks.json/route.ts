import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 3600;

/** Android Digital Asset Links — Play Console-ийн SHA-256 хурууны хээг env-ээс уншина. */
export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const body =
    fingerprints.length === 0
      ? []
      : [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: "mn.buunduu.surtsgaay",
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ];

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
