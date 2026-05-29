/** @deprecated Import from `@/lib/supabase/invitations` instead. */
export {
  acceptInvitation as acceptOrganizationInvitation,
  acceptInvitation,
  buildInviteMessageForInvitation,
  buildInviteUrlFromToken,
  createClassroomStudentInvitation,
  createOrganizationMemberInvitation,
  createOrganizationMemberInvitation as createOrganizationInvitation,
  generateInviteToken,
  getClassroomInvitations,
  getInvitationByToken,
  getInvitationByToken as lookupInvitationByToken,
  getInvitationPublicUrl,
  getOrganizationInvitations,
  markInvitationExpired,
  requestInvitationEmailSend,
  revokeInvitation,
  revokeInvitation as revokeOrganizationInvitation,
  type AcceptInvitationResult,
  type InviteResult,
} from "@/lib/supabase/invitations";

export { bulkInviteOrganizationMembers } from "@/lib/supabase/organization-invitations-bulk";
