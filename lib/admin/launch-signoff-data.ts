import { PRODUCTION_URL, productionUrl } from "@/lib/admin/launch-candidate-data";

export { PRODUCTION_URL, productionUrl };

export const SIGNOFF_STORAGE_KEY = "buunduu-launch-signoff";

export const DEFAULT_VERSION_LABEL = "v0.1-launch-candidate";

export type SignoffCheckStatus = "not_checked" | "pass" | "warning" | "fail";

export type SignoffDecisionValue =
  | "not_decided"
  | "go_live"
  | "needs_review"
  | "blocked";

export type SignoffSummaryCardDefinition = {
  id: string;
  label: string;
  description: string;
  href?: string;
  productionPath?: string;
};

export type SignoffCheckItemDefinition = {
  id: string;
  label: string;
  productionPath?: string;
};

export type SignoffItemState = {
  id: string;
  status: SignoffCheckStatus;
  notes: string;
  updatedAt: string;
};

export type SignoffCheckItem = SignoffCheckItemDefinition & SignoffItemState;

export type SignoffCardState = {
  id: string;
  status: SignoffCheckStatus;
  updatedAt: string;
};

export type SignoffDecisionState = {
  value: SignoffDecisionValue;
  updatedAt: string;
};

export type SignoffMetaState = {
  versionLabel: string;
  owner: string;
  launchNotes: string;
  knownIssues: string;
  finalDecisionNote: string;
};

export const SIGNOFF_SUMMARY_CARDS: SignoffSummaryCardDefinition[] = [
  {
    id: "card-deployment",
    label: "Deployment readiness",
    description: "Vercel production deploy and /deployment-check",
    href: "/deployment-check",
    productionPath: "/deployment-check",
  },
  {
    id: "card-supabase",
    label: "Supabase readiness",
    description: "production_verification.sql — no fail rows",
    href: "/admin/system-check",
    productionPath: "/admin/system-check",
  },
  {
    id: "card-auth",
    label: "Auth readiness",
    description: "Site URL, redirect URLs, login/logout",
    productionPath: "/login",
  },
  {
    id: "card-admin-cms",
    label: "Admin CMS readiness",
    description: "Create/edit/publish and admin routes",
    href: "/admin/lessons",
    productionPath: "/admin",
  },
  {
    id: "card-security",
    label: "Security readiness",
    description: "RLS audit, no service_role in client",
    href: "/admin/security-audit",
    productionPath: "/admin/security-audit",
  },
  {
    id: "card-launch-decision",
    label: "Launch decision",
    description: "Launch candidate and final sign-off aligned",
    href: "/admin/launch-candidate",
    productionPath: "/admin/launch-candidate",
  },
];

export const SIGNOFF_CHECKLIST: SignoffCheckItemDefinition[] = [
  {
    id: "signoff-deploy-live",
    label: "Production deployment is live",
    productionPath: "/",
  },
  {
    id: "signoff-deployment-check",
    label: "/deployment-check passes",
    productionPath: "/deployment-check",
  },
  {
    id: "signoff-system-check",
    label: "/admin/system-check passes",
    productionPath: "/admin/system-check",
  },
  {
    id: "signoff-production-qa",
    label: "/admin/production-qa reviewed",
    productionPath: "/admin/production-qa",
  },
  {
    id: "signoff-security-audit",
    label: "/admin/security-audit reviewed",
    productionPath: "/admin/security-audit",
  },
  {
    id: "signoff-supabase-sql",
    label: "Supabase production verification SQL reviewed",
  },
  {
    id: "signoff-auth-urls",
    label: "Supabase Auth URLs configured",
    productionPath: "/login",
  },
  {
    id: "signoff-admin-user",
    label: "Admin user verified",
    productionPath: "/admin",
  },
  {
    id: "signoff-public-lesson",
    label: "Public lesson route tested",
    productionPath: "/lessons/1",
  },
  {
    id: "signoff-login-logout",
    label: "Login/logout tested",
    productionPath: "/login",
  },
  {
    id: "signoff-quiz-save",
    label: "Quiz attempt save tested",
    productionPath: "/lessons/1/quiz",
  },
  {
    id: "signoff-vocab-save",
    label: "Vocabulary learned save tested",
    productionPath: "/lessons/1/vocabulary",
  },
  {
    id: "signoff-lesson-progress",
    label: "Lesson progress save tested",
    productionPath: "/lessons/1",
  },
  {
    id: "signoff-media",
    label: "Media/storage tested",
    productionPath: "/admin/system-check",
  },
  {
    id: "signoff-activity",
    label: "Activity log tested",
    productionPath: "/admin/activity",
  },
  {
    id: "signoff-tasks",
    label: "Task center tested",
    productionPath: "/admin/tasks",
  },
  {
    id: "signoff-rollback",
    label: "Rollback plan reviewed",
  },
  {
    id: "signoff-monitoring",
    label: "Post-launch monitoring plan reviewed",
  },
];

export function defaultSignoffItemState(id: string): SignoffItemState {
  return {
    id,
    status: "not_checked",
    notes: "",
    updatedAt: new Date(0).toISOString(),
  };
}

export function defaultSignoffCardState(id: string): SignoffCardState {
  return {
    id,
    status: "not_checked",
    updatedAt: new Date(0).toISOString(),
  };
}

export function defaultSignoffDecision(): SignoffDecisionState {
  return { value: "not_decided", updatedAt: new Date(0).toISOString() };
}

export function defaultSignoffMeta(): SignoffMetaState {
  return {
    versionLabel: DEFAULT_VERSION_LABEL,
    owner: "",
    launchNotes: "",
    knownIssues: "",
    finalDecisionNote: "",
  };
}

export function mergeSignoffItems(
  states: Record<string, SignoffItemState>
): SignoffCheckItem[] {
  return SIGNOFF_CHECKLIST.map((def) => ({
    ...def,
    ...(states[def.id] ?? defaultSignoffItemState(def.id)),
  }));
}

export function mergeSignoffCards(
  states: Record<string, SignoffCardState>
): SignoffCardState[] {
  return SIGNOFF_SUMMARY_CARDS.map(
    (def) => states[def.id] ?? defaultSignoffCardState(def.id)
  );
}

export type LaunchSignoffState = {
  items: SignoffCheckItem[];
  cards: SignoffCardState[];
  decision: SignoffDecisionState;
  meta: SignoffMetaState;
};
