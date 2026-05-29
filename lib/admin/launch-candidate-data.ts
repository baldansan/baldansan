/** Live production deployment URL — no secrets. */
export const PRODUCTION_URL = "https://baldansan.vercel.app";

export const LAUNCH_STORAGE_KEY = "buunduu-launch-candidate";

export type LaunchCheckStatus = "not_checked" | "pass" | "warning" | "fail";

export type LaunchDecisionValue =
  | "not_set"
  | "launch_candidate"
  | "needs_review";

export type LaunchSectionId =
  | "public"
  | "admin"
  | "auth_progress"
  | "supabase_media";

export type LaunchStatusCardDefinition = {
  id: string;
  label: string;
  description: string;
  href?: string;
  productionPath?: string;
};

export type LaunchCheckItemDefinition = {
  id: string;
  section: LaunchSectionId;
  label: string;
  productionPath?: string;
};

export type LaunchItemState = {
  id: string;
  status: LaunchCheckStatus;
  notes: string;
  updatedAt: string;
};

export type LaunchCheckItem = LaunchCheckItemDefinition & LaunchItemState;

export type LaunchCardState = {
  id: string;
  status: LaunchCheckStatus;
  updatedAt: string;
};

export type LaunchDecisionState = {
  value: LaunchDecisionValue;
  updatedAt: string;
};

export const LAUNCH_STATUS_CARDS: LaunchStatusCardDefinition[] = [
  {
    id: "card-deployment-check",
    label: "Deployment check",
    description: "Public /deployment-check smoke test",
    href: "/deployment-check",
    productionPath: "/deployment-check",
  },
  {
    id: "card-system-check",
    label: "System check",
    description: "Admin runtime Supabase verification",
    href: "/admin/system-check",
    productionPath: "/admin/system-check",
  },
  {
    id: "card-production-qa",
    label: "Production QA",
    description: "Manual route and CMS checklist",
    href: "/admin/production-qa",
    productionPath: "/admin/production-qa",
  },
  {
    id: "card-security-audit",
    label: "Security audit",
    description: "RLS, auth, storage, visibility",
    href: "/admin/security-audit",
    productionPath: "/admin/security-audit",
  },
  {
    id: "card-supabase-verification",
    label: "Supabase verification",
    description: "production_verification.sql — no fail rows",
  },
  {
    id: "card-admin-cms",
    label: "Admin CMS readiness",
    description: "Create/edit/publish workflow tested",
    href: "/admin/lessons",
    productionPath: "/admin/lessons",
  },
  {
    id: "card-public-routes",
    label: "Public route readiness",
    description: "Learner pages on production URL",
    productionPath: "/courses/hsk5",
  },
  {
    id: "card-launch-blockers",
    label: "Launch blocker count",
    description: "Review fail items in smoke test below",
  },
];

export const LAUNCH_SMOKE_CHECKLIST: LaunchCheckItemDefinition[] = [
  // Public
  { id: "smoke-home", section: "public", label: "Home page loads", productionPath: "/" },
  { id: "smoke-courses", section: "public", label: "Courses page loads", productionPath: "/courses" },
  { id: "smoke-hsk5", section: "public", label: "HSK5 course page loads", productionPath: "/courses/hsk5" },
  { id: "smoke-lesson-1", section: "public", label: "Lesson 1 detail loads", productionPath: "/lessons/1" },
  { id: "smoke-lesson-1-watch", section: "public", label: "Lesson 1 watch loads", productionPath: "/lessons/1/watch" },
  { id: "smoke-lesson-1-vocab", section: "public", label: "Lesson 1 vocabulary loads", productionPath: "/lessons/1/vocabulary" },
  { id: "smoke-lesson-1-quiz", section: "public", label: "Lesson 1 quiz loads", productionPath: "/lessons/1/quiz" },
  { id: "smoke-login", section: "public", label: "Login page loads", productionPath: "/login" },
  { id: "smoke-signup", section: "public", label: "Signup page loads", productionPath: "/signup" },
  { id: "smoke-profile", section: "public", label: "Profile works after login", productionPath: "/profile" },
  { id: "smoke-review", section: "public", label: "Review works after login", productionPath: "/review" },
  // Admin
  { id: "smoke-admin-dash", section: "admin", label: "Admin dashboard loads", productionPath: "/admin" },
  { id: "smoke-system-check", section: "admin", label: "System check passes", productionPath: "/admin/system-check" },
  { id: "smoke-production-qa", section: "admin", label: "Production QA exists", productionPath: "/admin/production-qa" },
  { id: "smoke-security-audit", section: "admin", label: "Security audit exists", productionPath: "/admin/security-audit" },
  { id: "smoke-final-audit", section: "admin", label: "Final audit exists", productionPath: "/admin/final-audit" },
  { id: "smoke-lesson-editor", section: "admin", label: "Lesson editor opens", productionPath: "/admin/lessons/5/edit" },
  { id: "smoke-tasks", section: "admin", label: "Task center opens", productionPath: "/admin/tasks" },
  { id: "smoke-activity", section: "admin", label: "Activity log opens", productionPath: "/admin/activity" },
  { id: "smoke-analytics", section: "admin", label: "Analytics opens", productionPath: "/admin/analytics" },
  // Auth / progress
  { id: "smoke-auth-login", section: "auth_progress", label: "Login works", productionPath: "/login" },
  { id: "smoke-auth-logout", section: "auth_progress", label: "Logout works" },
  { id: "smoke-quiz-save", section: "auth_progress", label: "Quiz attempt saves", productionPath: "/lessons/1/quiz" },
  { id: "smoke-vocab-save", section: "auth_progress", label: "Vocabulary learned saves", productionPath: "/lessons/1/vocabulary" },
  { id: "smoke-lesson-progress", section: "auth_progress", label: "Lesson progress saves", productionPath: "/lessons/1" },
  { id: "smoke-guest-fallback", section: "auth_progress", label: "Guest fallback still works", productionPath: "/lessons/1" },
  // Supabase / media
  { id: "smoke-public-lessons", section: "supabase_media", label: "Public lessons read", productionPath: "/deployment-check" },
  { id: "smoke-admin-profile", section: "supabase_media", label: "Admin profile read", productionPath: "/admin/system-check" },
  { id: "smoke-storage", section: "supabase_media", label: "Storage bucket works", productionPath: "/admin/system-check" },
  { id: "smoke-thumbnail", section: "supabase_media", label: "Thumbnail/media URL loads if available", productionPath: "/lessons/1" },
  { id: "smoke-activity-insert", section: "supabase_media", label: "Activity log insert works", productionPath: "/admin/activity" },
  { id: "smoke-task-persist", section: "supabase_media", label: "Task persistence works", productionPath: "/admin/tasks" },
];

export const LAUNCH_SECTION_LABELS: Record<LaunchSectionId, string> = {
  public: "Public smoke test",
  admin: "Admin smoke test",
  auth_progress: "Auth & progress",
  supabase_media: "Supabase & media",
};

export const KNOWN_LAUNCH_LIMITATIONS = [
  "No payment — Phase 7",
  "No native mobile app — Phase 8",
  "Guest progress sync requires login via Profile",
  "Activity log reads use browser admin session",
  "No video transcoding/CDN — external URLs or Supabase Storage as-is",
];

export function productionUrl(path: string): string {
  const base = PRODUCTION_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function defaultItemState(id: string): LaunchItemState {
  return {
    id,
    status: "not_checked",
    notes: "",
    updatedAt: new Date(0).toISOString(),
  };
}

export function defaultCardState(id: string): LaunchCardState {
  return {
    id,
    status: "not_checked",
    updatedAt: new Date(0).toISOString(),
  };
}

export function defaultDecision(): LaunchDecisionState {
  return { value: "not_set", updatedAt: new Date(0).toISOString() };
}

export function mergeLaunchItems(
  states: Record<string, LaunchItemState>
): LaunchCheckItem[] {
  return LAUNCH_SMOKE_CHECKLIST.map((def) => ({
    ...def,
    ...(states[def.id] ?? defaultItemState(def.id)),
  }));
}

export function mergeLaunchCards(
  states: Record<string, LaunchCardState>
): LaunchCardState[] {
  return LAUNCH_STATUS_CARDS.map(
    (def) => states[def.id] ?? defaultCardState(def.id)
  );
}
