import {
  createKid,
  getKidsCaller,
  kidsJson,
  readJsonBody,
  stringField,
} from "@/lib/kids/server";

/**
 * Хүүхдийн бүртгэл үүсгэнэ (нэвтэрсэн эцэг эх/багш = асран хамгаалагч).
 * Body: { displayName, avatar, pin, birthYear?, classroomJoinCode?, classroomId? }
 * SUPABASE_SERVICE_ROLE_KEY шаардлагатай.
 */
export async function POST(request: Request) {
  const caller = await getKidsCaller();
  if (!caller.ok) return kidsJson(caller);

  const body = await readJsonBody(request);
  const birthYear = body.birthYear;
  return kidsJson(
    await createKid({
      guardianUserId: caller.data.userId,
      displayName: stringField(body, "displayName") ?? "",
      avatar: stringField(body, "avatar") ?? null,
      pin: stringField(body, "pin") ?? "",
      birthYear: typeof birthYear === "number" || typeof birthYear === "string" ? birthYear : null,
      classroomJoinCode: stringField(body, "classroomJoinCode") ?? null,
      classroomId: stringField(body, "classroomId") ?? null,
    })
  );
}
