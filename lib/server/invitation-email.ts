/** @deprecated Use `@/lib/server/email/*` modules. */
export {
  buildInvitationEmailContent,
  buildOrganizationInviteEmailContent,
  buildClassroomStudentInviteEmailContent,
  resolveInvitationEmailBaseUrl,
} from "@/lib/server/email/invitation-email";

export {
  isEmailProviderConfigured as isInvitationEmailProviderConfigured,
  getEmailProviderStatus,
  sendEmail,
} from "@/lib/server/email/email-provider";

export { sendInvitationEmailForId } from "@/lib/server/email/send-invitation-email";
