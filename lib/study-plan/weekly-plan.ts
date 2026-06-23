export type StudyPlanIconKind =
  | "book"
  | "vocabulary"
  | "help-circle"
  | "refresh"
  | "file";

export type StudyPlanWeeklyItem = {
  dayOfWeek: number;
  dayName: string;
  task: string;
  href: string;
  icon: StudyPlanIconKind;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
};

type WeeklyPlanTemplate = {
  dayOfWeek: number;
  dayName: string;
  task: string;
  icon: StudyPlanIconKind;
  hrefKey: "course" | "review" | "weekly-report";
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const WEEKLY_PLAN_TEMPLATES: WeeklyPlanTemplate[] = [
  {
    dayOfWeek: 1,
    dayName: "Даваа",
    task: "Хичээл үзэх",
    icon: "book",
    hrefKey: "course",
  },
  {
    dayOfWeek: 2,
    dayName: "Мягмар",
    task: "Шинэ үг",
    icon: "vocabulary",
    hrefKey: "review",
  },
  {
    dayOfWeek: 3,
    dayName: "Лхагва",
    task: "Сорил",
    icon: "help-circle",
    hrefKey: "course",
  },
  {
    dayOfWeek: 4,
    dayName: "Пүрэв",
    task: "Давтлага",
    icon: "refresh",
    hrefKey: "review",
  },
  {
    dayOfWeek: 5,
    dayName: "Баасан",
    task: "Шинэ хичээл",
    icon: "book",
    hrefKey: "course",
  },
  {
    dayOfWeek: 6,
    dayName: "Бямба",
    task: "Давтлага + сорил дахих",
    icon: "refresh",
    hrefKey: "review",
  },
  {
    dayOfWeek: 0,
    dayName: "Ням",
    task: "Долоо хоногийн тайлан",
    icon: "file",
    hrefKey: "weekly-report",
  },
];

function resolveHref(
  hrefKey: WeeklyPlanTemplate["hrefKey"],
  courseHref: string
): string {
  if (hrefKey === "course") return courseHref;
  if (hrefKey === "review") return "/review";
  return "/weekly-report";
}

function weekPhase(
  dayOfWeek: number,
  today: number
): "past" | "today" | "future" {
  if (dayOfWeek === today) return "today";
  const todayIdx = WEEK_ORDER.indexOf(today as (typeof WEEK_ORDER)[number]);
  const dayIdx = WEEK_ORDER.indexOf(dayOfWeek as (typeof WEEK_ORDER)[number]);
  if (dayIdx < todayIdx) return "past";
  return "future";
}

export function buildWeeklyPlan(courseHref: string): StudyPlanWeeklyItem[] {
  const today = new Date().getDay();

  return WEEKLY_PLAN_TEMPLATES.map((item) => {
    const phase = weekPhase(item.dayOfWeek, today);
    return {
      dayOfWeek: item.dayOfWeek,
      dayName: item.dayName,
      task: item.task,
      href: resolveHref(item.hrefKey, courseHref),
      icon: item.icon,
      isToday: phase === "today",
      isPast: phase === "past",
      isFuture: phase === "future",
    };
  });
}
