import {
  getKidsCaller,
  kidsJson,
  readJsonBody,
  stringField,
  updateKid,
} from "@/lib/kids/server";

/**
 * Хүүхдийн бүртгэл засах (зөвхөн асран хамгаалагч).
 * Body: { childUserId, displayName?, avatar?, pin?, birthYear?, classroomJoinCode? }
 * classroomJoinCode: талбар байхгүй = өөрчлөхгүй, "" эсвэл null = ангиас гаргах.
 */
export async function POST(request: Request) {
  const caller = await getKidsCaller();
  if (!caller.ok) return kidsJson(caller);

  const body = await readJsonBody(request);
  const birthYear = body.birthYear;
  const hasClassField = Object.prototype.hasOwnProperty.call(body, "classroomJoinCode");
  return kidsJson(
    await updateKid({
      guardianUserId: caller.data.userId,
      childUserId: stringField(body, "childUserId") ?? "",
      displayName: stringField(body, "displayName"),
      avatar: stringField(body, "avatar"),
      pin: stringField(body, "pin") || undefined,
      birthYear:
        birthYear === undefined
          ? undefined
          : typeof birthYear === "number" || typeof birthYear === "string"
            ? birthYear
            : null,
      classroomJoinCode: hasClassField ? stringField(body, "classroomJoinCode") ?? null : undefined,
    })
  );
}
