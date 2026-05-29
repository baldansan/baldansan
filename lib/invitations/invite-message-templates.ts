import type { InvitationLookup } from "@/lib/b2b/types";

export type InviteMessage = {
  subject: string;
  body: string;
  sms: string;
};

export function buildOrganizationInviteEmail(
  invitation: Pick<
    InvitationLookup,
    "displayName" | "email" | "role" | "organizationName"
  >,
  inviteUrl: string
): InviteMessage {
  const name = invitation.displayName ?? invitation.email ?? "there";
  const orgName =
    "organizationName" in invitation && invitation.organizationName
      ? invitation.organizationName
      : "байгууллага";

  const subject = "Бөөндөө Сурцгаая platform-д багшаар нэгдэх урилга";
  const body = [
    `Сайн байна уу, ${name}.`,
    "",
    `Таныг ${orgName} байгууллагын Бөөндөө Сурцгаая сургалтын platform-д ${invitation.role} эрхээр урьж байна.`,
    "Доорх link-ээр орж account-аа холбож урилгаа баталгаажуулна уу:",
    inviteUrl,
    "",
    "Энэ link тодорхой хугацаанд хүчинтэй.",
  ].join("\n");

  const sms = `Бөөндөө Сурцгаая: ${orgName} урилга. ${inviteUrl}`;

  return { subject, body, sms };
}

export function buildClassroomStudentInviteEmail(
  invitation: Pick<InvitationLookup, "displayName" | "email" | "classroomName">,
  inviteUrl: string
): InviteMessage {
  const name = invitation.displayName ?? invitation.email ?? "there";
  const classroomName = invitation.classroomName ?? "classroom";

  const subject = "Бөөндөө Сурцгаая хичээлд нэгдэх урилга";
  const body = [
    `Сайн байна уу, ${name}.`,
    "",
    `Таныг ${classroomName} classroom-д сурагчаар нэгдэхээр урьж байна.`,
    "Доорх link-ээр орж account-аа холбож хичээлээ эхлүүлнэ үү:",
    inviteUrl,
    "",
    "Энэ link тодорхой хугацаанд хүчинтэй.",
  ].join("\n");

  const sms = `Бөөндөө Сурцгаая: ${classroomName} урилга. ${inviteUrl}`;

  return { subject, body, sms };
}

export function buildInviteSmsShort(
  invitation: Pick<InvitationLookup, "organizationName" | "inviteKind"> & {
    classroomName?: string | null;
  },
  inviteUrl: string
): string {
  if (invitation.inviteKind === "classroom_student") {
    return buildClassroomStudentInviteEmail(
      { displayName: null, email: null, classroomName: invitation.classroomName ?? null },
      inviteUrl
    ).sms;
  }
  return buildOrganizationInviteEmail(
    {
      displayName: null,
      email: null,
      role: "teacher",
      organizationName: invitation.organizationName,
    },
    inviteUrl
  ).sms;
}

export function buildInviteMessage(
  invitation: InvitationLookup,
  inviteUrl: string
): InviteMessage {
  if (invitation.inviteKind === "classroom_student") {
    return buildClassroomStudentInviteEmail(
      {
        displayName: invitation.displayName,
        email: invitation.email,
        classroomName: invitation.classroomName ?? null,
      },
      inviteUrl
    );
  }
  return buildOrganizationInviteEmail(invitation, inviteUrl);
}
