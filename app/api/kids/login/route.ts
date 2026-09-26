import {
  getKidsCaller,
  kidLogin,
  kidsJson,
  readJsonBody,
  stringField,
} from "@/lib/kids/server";

/**
 * Хүүхдээр нэвтрэх: асран хамгаалагч (эсвэл ангийн багш) нэвтэрсэн байх + зөв PIN.
 * Body: { childUserId, pin } → { accessToken, refreshToken, displayName, avatar }
 */
export async function POST(request: Request) {
  const caller = await getKidsCaller();
  if (!caller.ok) return kidsJson(caller);

  const body = await readJsonBody(request);
  return kidsJson(
    await kidLogin({
      guardianUserId: caller.data.userId,
      childUserId: stringField(body, "childUserId") ?? "",
      pin: stringField(body, "pin") ?? "",
    })
  );
}
