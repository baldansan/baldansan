import {
  deleteKid,
  getKidsCaller,
  kidsJson,
  readJsonBody,
  stringField,
} from "@/lib/kids/server";

/**
 * Хүүхдийн бүртгэлийг бүрмөсөн устгана (зөвхөн асран хамгаалагч).
 * Body: { childUserId }
 */
export async function POST(request: Request) {
  const caller = await getKidsCaller();
  if (!caller.ok) return kidsJson(caller);

  const body = await readJsonBody(request);
  return kidsJson(
    await deleteKid({
      guardianUserId: caller.data.userId,
      childUserId: stringField(body, "childUserId") ?? "",
    })
  );
}
