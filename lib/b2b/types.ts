/** B2B organization + inquiry types — Phase 7 Step 10 */

export type OrganizationType =
  | "training_center"
  | "school"
  | "university"
  | "teacher"
  | "company"
  | "other";

export type OrganizationStatus =
  | "lead"
  | "contacted"
  | "demo_scheduled"
  | "pilot"
  | "active"
  | "paused"
  | "closed";

export type OrganizationMemberRole =
  | "owner"
  | "manager"
  | "teacher"
  | "assistant"
  | "student";

export type OrganizationMemberStatus = "invited" | "active" | "inactive";

export type B2BInquiryStatus =
  | "new"
  | "contacted"
  | "demo_scheduled"
  | "proposal_sent"
  | "pilot"
  | "won"
  | "lost"
  | "archived";

export type Organization = {
  id: string;
  name: string;
  organizationType: OrganizationType;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  role: OrganizationMemberRole;
  status: OrganizationMemberStatus;
  permissions: Record<string, unknown>;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type B2BInquiry = {
  id: string;
  organizationName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  organizationType: string | null;
  studentCount: string | null;
  interestedPackage: string | null;
  message: string | null;
  source: string;
  status: B2BInquiryStatus;
  assignedTo: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type B2BInquiryActivity = {
  id: string;
  inquiryId: string;
  actorUserId: string | null;
  action: string;
  note: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type MyOrganization = Organization & {
  memberId: string;
  memberRole: OrganizationMemberRole;
  memberStatus: OrganizationMemberStatus;
  permissions?: Record<string, unknown>;
  joinedAt?: string | null;
};

export type OrganizationDashboardData = {
  organization: Organization;
  membership: Pick<
    MyOrganization,
    "memberId" | "memberRole" | "memberStatus" | "permissions" | "joinedAt"
  >;
  teacherCount: number;
  classroomCount: number;
  studentCount: number;
  assignmentCount: number;
  members: OrganizationMember[];
  classrooms: import("@/lib/classroom/types").Classroom[];
  assignments: import("@/lib/classroom/types").Assignment[];
};

export type B2BCrmSummary = {
  newInquiries: number;
  contactedInquiries: number;
  demoScheduledInquiries: number;
  pilotInquiries: number;
  wonInquiries: number;
  lostInquiries: number;
  activeOrganizations: number;
  migrationPending: boolean;
  onboardingNotStarted?: number;
  onboardingInProgress?: number;
  onboardingReadyForPilot?: number;
  onboardingPilotRunning?: number;
  onboardingPaused?: number;
};

export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_pilot"
  | "pilot_running"
  | "completed"
  | "paused";

export type PilotStage =
  | "inquiry"
  | "organization_setup"
  | "teacher_setup"
  | "classroom_setup"
  | "assignment_setup"
  | "student_invite"
  | "pilot_ready"
  | "pilot_running"
  | "pilot_review";

export type OnboardingTaskStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "skipped";

export type OrganizationOnboarding = {
  organizationId: string;
  onboardingStatus: OnboardingStatus;
  pilotStage: PilotStage;
  targetStartDate: string | null;
  targetStudentCount: number | null;
  pilotGoal: string | null;
  onboardingNote: string | null;
  completedSteps: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationOnboardingTask = {
  id: string;
  organizationId: string;
  taskKey: string;
  title: string;
  description: string | null;
  category: string;
  status: OnboardingTaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  completedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PilotReadiness = {
  ready: boolean;
  score: number;
  completedCount: number;
  totalCount: number;
  blockers: string[];
  warnings: string[];
};

export type OrganizationPilotSummary = {
  organizationId: string;
  organizationName: string;
  onboarding: OrganizationOnboarding | null;
  readiness: PilotReadiness;
  tasks: OrganizationOnboardingTask[];
};

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type InviteKind = "organization_member" | "classroom_student";

export type OrganizationInvitation = {
  id: string;
  organizationId: string;
  organizationMemberId: string | null;
  classroomId: string | null;
  inviteToken: string;
  email: string | null;
  displayName: string | null;
  role: OrganizationMemberRole;
  inviteKind: InviteKind;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  createdBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type InvitationLookup = {
  invitationId: string;
  organizationId: string;
  organizationName: string;
  classroomId: string | null;
  classroomName: string | null;
  email: string | null;
  displayName: string | null;
  role: string;
  inviteKind: string;
  status: string;
  expiresAt: string;
};

export type BulkInviteRow = {
  email: string;
  displayName?: string;
  role?: OrganizationMemberRole;
};

export type BulkInviteResult = {
  successCount: number;
  errorCount: number;
  errors: string[];
  invitations: OrganizationInvitation[];
};

export type InvitationEmailDeliveryStatus =
  | "queued"
  | "sent"
  | "failed"
  | "skipped"
  | "manual_copy";

export type InvitationEmailDelivery = {
  id: string;
  invitationId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  provider: string;
  status: InvitationEmailDeliveryStatus;
  errorMessage: string | null;
  sentAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  inviteKind?: string | null;
  organizationName?: string | null;
  classroomName?: string | null;
};

export type InvitationDeliveryStatus =
  | "queued"
  | "sent"
  | "failed"
  | "skipped";

export type OrganizationInvitationDelivery = {
  id: string;
  invitationId: string;
  organizationId: string;
  channel: string;
  deliveryStatus: InvitationDeliveryStatus;
  recipientEmail: string;
  subject: string;
  bodyText: string;
  provider: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};
