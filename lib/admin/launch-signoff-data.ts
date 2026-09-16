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
    label: "Байршуулалтын бэлэн байдал",
    description: "Vercel дээрх ажлын орчны байршуулалт болон /deployment-check",
    href: "/deployment-check",
    productionPath: "/deployment-check",
  },
  {
    id: "card-supabase",
    label: "Supabase-ийн бэлэн байдал",
    description: "production_verification.sql — алдаатай мөр байхгүй",
    href: "/admin/system-check",
    productionPath: "/admin/system-check",
  },
  {
    id: "card-auth",
    label: "Нэвтрэлтийн бэлэн байдал",
    description: "Site URL, redirect URL-ууд, нэвтрэх/гарах",
    productionPath: "/login",
  },
  {
    id: "card-admin-cms",
    label: "Удирдлагын хэсгийн бэлэн байдал",
    description: "Үүсгэх/засах/нийтлэх болон админ хуудсууд",
    href: "/admin/lessons",
    productionPath: "/admin",
  },
  {
    id: "card-security",
    label: "Аюулгүй байдлын бэлэн байдал",
    description: "RLS үзлэг, клиент талд service_role байхгүй",
    href: "/admin/security-audit",
    productionPath: "/admin/security-audit",
  },
  {
    id: "card-launch-decision",
    label: "Гаргалтын шийдвэр",
    description: "Гаргахад нэр дэвшсэн хувилбар ба эцсийн баталгаа нийцсэн",
    href: "/admin/launch-candidate",
    productionPath: "/admin/launch-candidate",
  },
];

export const SIGNOFF_CHECKLIST: SignoffCheckItemDefinition[] = [
  {
    id: "signoff-deploy-live",
    label: "Ажлын орчны байршуулалт ажиллаж байна",
    productionPath: "/",
  },
  {
    id: "signoff-deployment-check",
    label: "/deployment-check амжилттай",
    productionPath: "/deployment-check",
  },
  {
    id: "signoff-system-check",
    label: "/admin/system-check амжилттай",
    productionPath: "/admin/system-check",
  },
  {
    id: "signoff-production-qa",
    label: "/admin/production-qa хуудсыг шалгасан",
    productionPath: "/admin/production-qa",
  },
  {
    id: "signoff-security-audit",
    label: "/admin/security-audit хуудсыг шалгасан",
    productionPath: "/admin/security-audit",
  },
  {
    id: "signoff-supabase-sql",
    label: "Supabase-ийн production_verification.sql-ийг шалгасан",
  },
  {
    id: "signoff-auth-urls",
    label: "Supabase Auth URL-ууд тохируулагдсан",
    productionPath: "/login",
  },
  {
    id: "signoff-admin-user",
    label: "Админ хэрэглэгч шалгагдсан",
    productionPath: "/admin",
  },
  {
    id: "signoff-public-lesson",
    label: "Нийтийн хичээлийн хуудсыг шалгасан",
    productionPath: "/lessons/1",
  },
  {
    id: "signoff-login-logout",
    label: "Нэвтрэх/гарахыг шалгасан",
    productionPath: "/login",
  },
  {
    id: "signoff-quiz-save",
    label: "Дасгалын оролдлого хадгалагдахыг шалгасан",
    productionPath: "/lessons/1/quiz",
  },
  {
    id: "signoff-vocab-save",
    label: "Сурсан үг хадгалагдахыг шалгасан",
    productionPath: "/lessons/1/vocabulary",
  },
  {
    id: "signoff-lesson-progress",
    label: "Хичээлийн ахиц хадгалагдахыг шалгасан",
    productionPath: "/lessons/1",
  },
  {
    id: "signoff-media",
    label: "Медиа болон файл хадгалалтыг шалгасан",
    productionPath: "/admin/system-check",
  },
  {
    id: "signoff-activity",
    label: "Үйлдлийн бүртгэлийг шалгасан",
    productionPath: "/admin/activity",
  },
  {
    id: "signoff-tasks",
    label: "Ажлын төвийг шалгасан",
    productionPath: "/admin/tasks",
  },
  {
    id: "signoff-rollback",
    label: "Буцаах төлөвлөгөөг үзсэн",
  },
  {
    id: "signoff-monitoring",
    label: "Гаргасны дараах хяналтын төлөвлөгөөг үзсэн",
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
