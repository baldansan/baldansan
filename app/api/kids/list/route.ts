import { getKidsCaller, kidsJson, listKids } from "@/lib/kids/server";

/**
 * Хүүхдийн жагсаалт.
 * - `?classroomId=` өгөөгүй бол: нэвтэрсэн эцэг эхийн хүүхдүүд.
 * - `?classroomId=<id>`: тухайн ангийн хүүхдүүд (багш эрх шалгана).
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const caller = await getKidsCaller();
  if (!caller.ok) return kidsJson(caller);

  const { searchParams } = new URL(request.url);
  const classroomId = searchParams.get("classroomId")?.trim() || null;
  return kidsJson(await listKids({ callerUserId: caller.data.userId, classroomId }));
}
