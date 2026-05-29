import type { InvitationLookup, OrganizationInvitation } from "@/lib/b2b/types";
import { buildInviteUrl } from "@/lib/organization/invite-url";

export type InvitationEmailContent = {
  subject: string;
  text: string;
  html: string;
  recipientEmail: string;
  inviteUrl: string;
};

type InviteContext = Pick<
  InvitationLookup,
  | "organizationName"
  | "classroomName"
  | "displayName"
  | "email"
  | "role"
  | "inviteKind"
>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtmlParagraphs(lines: string[]): string {
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n");
}

export function buildOrganizationInviteEmailContent(
  invitation: InviteContext,
  inviteUrl: string
): InvitationEmailContent {
  const name = invitation.displayName ?? invitation.email ?? "there";
  const orgName = invitation.organizationName || "байгууллага";
  const subject = "Бөөндөө Сурцгаая platform-д нэгдэх урилга";

  const textLines = [
    `Сайн байна уу, ${name}.`,
    "",
    `Таныг ${orgName} байгууллагын Бөөндөө Сурцгаая сургалтын platform-д ${invitation.role} эрхээр урьж байна.`,
    "Доорх link-ээр орж account-аа холбож урилгаа баталгаажуулна уу:",
    inviteUrl,
    "",
    "Энэ link тодорхой хугацаанд хүчинтэй.",
  ];

  const html = [
    buildHtmlParagraphs(textLines.slice(0, 3)),
    `<p><a href="${escapeHtml(inviteUrl)}">${escapeHtml(inviteUrl)}</a></p>`,
    `<p><em>Энэ link тодорхой хугацаанд хүчинтэй.</em></p>`,
  ].join("\n");

  return {
    subject,
    text: textLines.join("\n"),
    html,
    recipientEmail: invitation.email ?? "",
    inviteUrl,
  };
}

export function buildClassroomStudentInviteEmailContent(
  invitation: Pick<InviteContext, "displayName" | "email" | "classroomName">,
  inviteUrl: string
): InvitationEmailContent {
  const name = invitation.displayName ?? invitation.email ?? "there";
  const classroomName = invitation.classroomName ?? "classroom";
  const subject = "Бөөндөө Сурцгаая classroom-д нэгдэх урилга";

  const textLines = [
    `Сайн байна уу, ${name}.`,
    "",
    `Таныг ${classroomName} classroom-д сурагчаар нэгдэхээр урьж байна.`,
    "Доорх link-ээр орж account-аа холбож хичээлээ эхлүүлнэ үү:",
    inviteUrl,
    "",
    "Энэ link тодорхой хугацаанд хүчинтэй.",
  ];

  const html = [
    buildHtmlParagraphs(textLines.slice(0, 3)),
    `<p><a href="${escapeHtml(inviteUrl)}">${escapeHtml(inviteUrl)}</a></p>`,
    `<p><em>Энэ link тодорхой хугацаанд хүчинтэй.</em></p>`,
  ].join("\n");

  return {
    subject,
    text: textLines.join("\n"),
    html,
    recipientEmail: invitation.email ?? "",
    inviteUrl,
  };
}

export function buildInvitationEmailContent(
  invitation: OrganizationInvitation & {
    organizationName?: string;
    classroomName?: string;
  },
  baseUrl?: string
): InvitationEmailContent {
  const inviteUrl = buildInviteUrl(invitation.inviteToken, baseUrl);
  const context: InviteContext = {
    organizationName: invitation.organizationName ?? "",
    classroomName: invitation.classroomName ?? null,
    displayName: invitation.displayName,
    email: invitation.email,
    role: invitation.role,
    inviteKind: invitation.inviteKind,
  };

  if (invitation.inviteKind === "classroom_student") {
    return buildClassroomStudentInviteEmailContent(context, inviteUrl);
  }
  return buildOrganizationInviteEmailContent(context, inviteUrl);
}

export function resolveInvitationEmailBaseUrl(request?: Request): string | undefined {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.trim();
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }
  if (request) {
    try {
      const origin = new URL(request.url).origin;
      if (origin.startsWith("http")) return origin;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}
