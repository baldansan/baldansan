import Link from "next/link";
import { StudyPlanCircularProgress } from "@/components/engagement/study-plan-circular-progress";
import { StudyPlanTablerIcon } from "@/components/engagement/study-plan-tabler-icon";
import { TemeeEmojiIcon } from "@/components/temee/temee-emoji-icon";
import type { StudyPlanData } from "@/lib/study-plan/study-plan-server";

type Props = {
  data: StudyPlanData;
};

export function StudyPlanContent({ data }: Props) {
  if (!data.isLoggedIn) {
    return (
      <div className="bs-study-plan-guest">
        <h1 className="bs-study-plan-title">Сургалтын төлөвлөгөө</h1>
        <p className="bs-study-plan-sub">
          Нэвтэрсний дараа өнөөдрийн хичээл, давталт, бичлэгийг эндээс харна.
        </p>
        <Link href="/login" className="bs-study-plan-login-btn">
          Нэвтрэх
        </Link>
        <Link href="/signup" className="bs-study-plan-signup-link">
          Бүртгүүлэх
        </Link>
      </div>
    );
  }

  const goal = data.dailyGoal;
  const rings = goal
    ? [
        {
          key: "lessons",
          label: "Хичээл",
          current: goal.goalProgress.lessons.current,
          target: goal.goalProgress.lessons.target,
        },
        {
          key: "words",
          label: "Үг",
          current: goal.goalProgress.words.current,
          target: goal.goalProgress.words.target,
        },
        {
          key: "quizzes",
          label: "Сорил",
          current: goal.goalProgress.quizzes.current,
          target: goal.goalProgress.quizzes.target,
        },
      ]
    : [];

  const todayPlan = data.weeklyPlan.find((item) => item.isToday);
  const todayHref =
    data.tasks.find((task) => !task.done)?.href ?? todayPlan?.href ?? data.courseHref;

  return (
    <div className="bs-study-plan">
      <header className="bs-study-plan-head">
        <h1 className="bs-study-plan-title">Сургалтын төлөвлөгөө</h1>
        <p className="bs-study-plan-sub">{data.levelLabel}</p>
      </header>

      {goal ? (
        <section className="bs-study-plan-goal-card">
          <div className="bs-study-plan-goal-top">
            <TemeeEmojiIcon variant="teach" width={64} height={64} />
            <div className="bs-study-plan-goal-copy">
              <h2 className="bs-study-plan-goal-title">Өдрийн зорилго</h2>
              <p className="bs-study-plan-goal-msg">
                Өнөөдөр {goal.lessonsPerDay} хичээл дуусгацгаая!
              </p>
            </div>
          </div>
          <div className="bs-study-plan-rings">
            {rings.map((ring) => (
              <StudyPlanCircularProgress
                key={ring.key}
                current={ring.current}
                target={ring.target}
                label={ring.label}
              />
            ))}
          </div>
          <p className="bs-study-plan-source">{goal.sourceLabel}</p>
        </section>
      ) : null}

      <section className="bs-study-plan-section">
        <h2 className="bs-study-plan-section-title">Долоо хоногийн төлөвлөгөө</h2>
        <ol className="bs-study-plan-timeline">
          {data.weeklyPlan.map((item) => {
            const rowClass = [
              "bs-study-plan-timeline-item",
              item.isToday ? "bs-study-plan-timeline-item--today" : "",
              item.isFuture ? "bs-study-plan-timeline-item--future" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <li key={item.dayOfWeek} className={rowClass}>
                <div className="bs-study-plan-timeline-rail" aria-hidden>
                  <span
                    className={`bs-study-plan-timeline-marker${
                      item.isPast ? " bs-study-plan-timeline-marker--done" : ""
                    }${item.isToday ? " bs-study-plan-timeline-marker--today" : ""}`}
                  >
                    {item.isPast ? (
                      <span className="bs-study-plan-timeline-check">✓</span>
                    ) : (
                      <StudyPlanTablerIcon
                        name={item.icon}
                        className="bs-study-plan-timeline-icon"
                      />
                    )}
                  </span>
                </div>
                <div className="bs-study-plan-timeline-body">
                  {item.isToday ? (
                    <Link href={todayHref} className="bs-study-plan-today-card">
                      <span className="bs-study-plan-today-label">
                        {item.dayName} · Өнөөдөр
                      </span>
                      <span className="bs-study-plan-today-task">{item.task}</span>
                      <span className="bs-study-plan-today-cta">Эхлэх →</span>
                    </Link>
                  ) : (
                    <Link href={item.href} className="bs-study-plan-day-card">
                      <span className="bs-study-plan-day-label">{item.dayName}</span>
                      <span className="bs-study-plan-day-task">{item.task}</span>
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
