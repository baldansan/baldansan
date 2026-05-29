/** Live production deployment URL — no secrets. */
export const PRODUCTION_URL = "https://baldansan.vercel.app";

export type QaCheckStatus = "not_checked" | "pass" | "warning" | "fail";

export type QaCheckSectionId =
  | "public"
  | "admin"
  | "auth"
  | "supabase"
  | "cms";

export type QaCheckItemDefinition = {
  id: string;
  section: QaCheckSectionId;
  label: string;
  route?: string;
  purpose: string;
  expected: string;
  /** Path on production (opens in new tab). */
  productionPath?: string;
};

export type QaCheckItemState = {
  id: string;
  status: QaCheckStatus;
  notes: string;
  updatedAt: string;
};

export type QaCheckItem = QaCheckItemDefinition & QaCheckItemState;

export const QA_STORAGE_KEY = "buunduu-production-qa";

export const QA_CHECKLIST: QaCheckItemDefinition[] = [
  // Public routes
  {
    id: "public-home",
    section: "public",
    label: "Home",
    route: "/",
    purpose: "Landing page loads",
    expected: "Page renders without error",
    productionPath: "/",
  },
  {
    id: "public-deployment-check",
    section: "public",
    label: "Deployment check",
    route: "/deployment-check",
    purpose: "Public deployment smoke test",
    expected: "Pass/warn checks; no secrets shown",
    productionPath: "/deployment-check",
  },
  {
    id: "public-courses",
    section: "public",
    label: "Courses",
    route: "/courses",
    purpose: "Course catalog",
    expected: "Course list renders",
    productionPath: "/courses",
  },
  {
    id: "public-hsk5",
    section: "public",
    label: "HSK5 course",
    route: "/courses/hsk5",
    purpose: "Available lessons only",
    expected: "Only published (available) lessons listed",
    productionPath: "/courses/hsk5",
  },
  {
    id: "public-lesson-1",
    section: "public",
    label: "Lesson 1 detail",
    route: "/lessons/1",
    purpose: "Lesson detail page",
    expected: "Lesson content loads",
    productionPath: "/lessons/1",
  },
  {
    id: "public-lesson-1-watch",
    section: "public",
    label: "Lesson 1 watch",
    route: "/lessons/1/watch",
    purpose: "Watch + subtitles",
    expected: "Video/subtitle UI loads",
    productionPath: "/lessons/1/watch",
  },
  {
    id: "public-lesson-1-vocab",
    section: "public",
    label: "Lesson 1 vocabulary",
    route: "/lessons/1/vocabulary",
    purpose: "Vocabulary list",
    expected: "Words display",
    productionPath: "/lessons/1/vocabulary",
  },
  {
    id: "public-lesson-1-quiz",
    section: "public",
    label: "Lesson 1 quiz",
    route: "/lessons/1/quiz",
    purpose: "Quiz flow",
    expected: "Quiz loads and submits",
    productionPath: "/lessons/1/quiz",
  },
  {
    id: "public-login",
    section: "public",
    label: "Login",
    route: "/login",
    purpose: "Sign-in page",
    expected: "Form renders; auth works after Redirect URLs set",
    productionPath: "/login",
  },
  {
    id: "public-signup",
    section: "public",
    label: "Signup",
    route: "/signup",
    purpose: "Registration page",
    expected: "Form renders; signup works",
    productionPath: "/signup",
  },
  {
    id: "public-profile",
    section: "public",
    label: "Profile",
    route: "/profile",
    purpose: "User dashboard",
    expected: "Loads when signed in",
    productionPath: "/profile",
  },
  {
    id: "public-review",
    section: "public",
    label: "Review",
    route: "/review",
    purpose: "Learned words review",
    expected: "Page renders",
    productionPath: "/review",
  },
  // Admin routes
  {
    id: "admin-dashboard",
    section: "admin",
    label: "Admin dashboard",
    route: "/admin",
    purpose: "Admin home",
    expected: "Metrics and cards load for admin",
    productionPath: "/admin",
  },
  {
    id: "admin-system-check",
    section: "admin",
    label: "System check",
    route: "/admin/system-check",
    purpose: "Runtime Supabase verification",
    expected: "No fail rows for admin session",
    productionPath: "/admin/system-check",
  },
  {
    id: "admin-final-audit",
    section: "admin",
    label: "Final audit",
    route: "/admin/final-audit",
    purpose: "Phase 5 readiness checklist",
    expected: "Checklist renders",
    productionPath: "/admin/final-audit",
  },
  {
    id: "admin-lesson-builder",
    section: "admin",
    label: "Lesson builder",
    route: "/admin/lesson-builder",
    purpose: "Guided workflow",
    expected: "Builder loads",
    productionPath: "/admin/lesson-builder",
  },
  {
    id: "admin-lessons",
    section: "admin",
    label: "Lessons list",
    route: "/admin/lessons",
    purpose: "Content QA table",
    expected: "Lessons list with QA badges",
    productionPath: "/admin/lessons",
  },
  {
    id: "admin-lessons-new",
    section: "admin",
    label: "New lesson",
    route: "/admin/lessons/new",
    purpose: "Create draft",
    expected: "Create form loads",
    productionPath: "/admin/lessons/new",
  },
  {
    id: "admin-lessons-5-edit",
    section: "admin",
    label: "Edit lesson 5",
    route: "/admin/lessons/5/edit",
    purpose: "Edit draft/content",
    expected: "Edit page loads (or lesson not found if missing)",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "admin-tasks",
    section: "admin",
    label: "Task center",
    route: "/admin/tasks",
    purpose: "Review queue",
    expected: "Tasks load",
    productionPath: "/admin/tasks",
  },
  {
    id: "admin-activity",
    section: "admin",
    label: "Activity log",
    route: "/admin/activity",
    purpose: "Audit trail",
    expected: "Activity list loads (client session)",
    productionPath: "/admin/activity",
  },
  {
    id: "admin-analytics",
    section: "admin",
    label: "Analytics",
    route: "/admin/analytics",
    purpose: "Learning metrics",
    expected: "Analytics dashboard loads",
    productionPath: "/admin/analytics",
  },
  {
    id: "admin-prompts",
    section: "admin",
    label: "Prompt library",
    route: "/admin/prompts",
    purpose: "AI prompt templates",
    expected: "Prompt library loads",
    productionPath: "/admin/prompts",
  },
  {
    id: "admin-production-qa",
    section: "admin",
    label: "Production QA",
    route: "/admin/production-qa",
    purpose: "Launch checklist",
    expected: "This page loads",
    productionPath: "/admin/production-qa",
  },
  // Auth
  {
    id: "auth-signup-opens",
    section: "auth",
    label: "Signup page opens",
    purpose: "Registration reachable",
    expected: "Signup form visible on production",
    productionPath: "/signup",
  },
  {
    id: "auth-login-opens",
    section: "auth",
    label: "Login page opens",
    purpose: "Sign-in reachable",
    expected: "Login form visible on production",
    productionPath: "/login",
  },
  {
    id: "auth-admin-login",
    section: "auth",
    label: "Admin can login",
    purpose: "Admin credentials work",
    expected: "Admin signs in on production URL",
  },
  {
    id: "auth-logout",
    section: "auth",
    label: "Logout works",
    purpose: "Session cleared",
    expected: "Logout returns to logged-out state",
  },
  {
    id: "auth-profile-user",
    section: "auth",
    label: "Profile shows user",
    purpose: "Authenticated profile",
    expected: "Email/user visible when signed in",
    productionPath: "/profile",
  },
  {
    id: "auth-admin-blocked-logged-out",
    section: "auth",
    label: "Admin blocked when logged out",
    purpose: "AdminGuard protection",
    expected: "/admin redirects or blocks non-admin",
    productionPath: "/admin",
  },
  {
    id: "auth-admin-works-logged-in",
    section: "auth",
    label: "Admin works when logged in",
    purpose: "Admin access",
    expected: "Admin routes load for admin user",
    productionPath: "/admin",
  },
  {
    id: "auth-supabase-redirect",
    section: "auth",
    label: "Supabase redirect URL configured",
    purpose: "Auth callback",
    expected: "Production URL in Supabase Auth Redirect URLs",
  },
  {
    id: "auth-security-audit",
    section: "auth",
    label: "Security audit completed",
    purpose: "Security / RLS final audit",
    expected: "No automatic fail on /admin/security-audit; manual checks reviewed",
    productionPath: "/admin/security-audit",
  },
  // Supabase
  {
    id: "supabase-public-content",
    section: "supabase",
    label: "Public content read works",
    purpose: "Learner content",
    expected: "/deployment-check or /courses/hsk5 shows data",
    productionPath: "/deployment-check",
  },
  {
    id: "supabase-lessons-read",
    section: "supabase",
    label: "Lessons table read works",
    purpose: "Content fetch",
    expected: "System check or deployment check pass",
    productionPath: "/admin/system-check",
  },
  {
    id: "supabase-admin-profile",
    section: "supabase",
    label: "Admin profile read works",
    purpose: "Admin role",
    expected: "System check admin profile pass",
    productionPath: "/admin/system-check",
  },
  {
    id: "supabase-progress-tables",
    section: "supabase",
    label: "Progress tables after login",
    purpose: "User progress RLS",
    expected: "Profile/progress works when signed in",
    productionPath: "/profile",
  },
  {
    id: "supabase-admin-tasks",
    section: "supabase",
    label: "Admin tasks table accessible",
    purpose: "Task center data",
    expected: "/admin/tasks loads tasks",
    productionPath: "/admin/tasks",
  },
  {
    id: "supabase-admin-activity",
    section: "supabase",
    label: "Admin activity table accessible",
    purpose: "Audit log data",
    expected: "/admin/activity shows rows when logged in",
    productionPath: "/admin/activity",
  },
  {
    id: "supabase-storage-url",
    section: "supabase",
    label: "Storage public URL works",
    purpose: "lesson-media bucket",
    expected: "System check storage pass",
    productionPath: "/admin/system-check",
  },
  {
    id: "supabase-media-thumbnail",
    section: "supabase",
    label: "Media thumbnail loads",
    purpose: "Lesson media display",
    expected: "Thumbnail visible on lesson if uploaded",
    productionPath: "/lessons/1",
  },
  // CMS workflow
  {
    id: "cms-create-draft",
    section: "cms",
    label: "Create draft lesson",
    purpose: "New content",
    expected: "Draft saved to Supabase",
    productionPath: "/admin/lessons/new",
  },
  {
    id: "cms-edit-metadata",
    section: "cms",
    label: "Edit metadata",
    purpose: "Lesson fields",
    expected: "Save metadata succeeds",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-bulk-import",
    section: "cms",
    label: "Bulk import JSON",
    purpose: "Content import",
    expected: "Import validates and saves",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-subtitle-add",
    section: "cms",
    label: "Manual subtitle add",
    purpose: "Subtitle editor",
    expected: "Subtitle row saved",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-vocab-add",
    section: "cms",
    label: "Manual vocabulary add",
    purpose: "Vocabulary editor",
    expected: "Word row saved",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-quiz-add",
    section: "cms",
    label: "Manual quiz add",
    purpose: "Quiz editor",
    expected: "Question row saved",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-media-upload",
    section: "cms",
    label: "Media upload",
    purpose: "Storage upload",
    expected: "File uploads to lesson-media",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-export-backup",
    section: "cms",
    label: "Export backup",
    purpose: "JSON export",
    expected: "Export JSON downloads",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-publish-unpublish",
    section: "cms",
    label: "Publish / unpublish",
    purpose: "Visibility",
    expected: "Status change reflects on /courses/hsk5",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-activity-log",
    section: "cms",
    label: "Activity log created",
    purpose: "Audit trail",
    expected: "Action appears in /admin/activity",
    productionPath: "/admin/activity",
  },
  {
    id: "cms-task-dismiss",
    section: "cms",
    label: "Task dismiss / resolve",
    purpose: "Task workflow",
    expected: "Task status updates persist",
    productionPath: "/admin/tasks",
  },
  {
    id: "cms-rollback-preview",
    section: "cms",
    label: "Rollback preview available",
    purpose: "Safe rollback",
    expected: "Activity detail shows rollback preview",
    productionPath: "/admin/activity",
  },
];

export const QA_SECTION_LABELS: Record<QaCheckSectionId, string> = {
  public: "Public route checklist",
  admin: "Admin route checklist",
  auth: "Auth checklist",
  supabase: "Supabase checklist",
  cms: "CMS workflow checklist",
};

export function productionUrl(path: string): string {
  const base = PRODUCTION_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function defaultItemState(id: string): QaCheckItemState {
  return {
    id,
    status: "not_checked",
    notes: "",
    updatedAt: new Date(0).toISOString(),
  };
}

export function mergeChecklistWithState(
  states: Record<string, QaCheckItemState>
): QaCheckItem[] {
  return QA_CHECKLIST.map((def) => ({
    ...def,
    ...(states[def.id] ?? defaultItemState(def.id)),
  }));
}
