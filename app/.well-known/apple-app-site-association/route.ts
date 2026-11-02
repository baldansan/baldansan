import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 3600;

/** iOS Universal Links — APPLE_TEAM_ID env-ээс уншина (өргөтгөлгүй, application/json). */
export function GET() {
  const teamId = (process.env.APPLE_TEAM_ID || "TEAMID").trim();
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [{ appID: `${teamId}.mn.buunduu.surtsgaay`, paths: ["*"] }],
      },
    },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" } },
  );
}
