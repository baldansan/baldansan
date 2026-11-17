import Link from "next/link";
import { MyStudySystem } from "@/components/engagement/my-study-system";
import { ExamGoalCard } from "@/components/engagement/exam-goal-card";
import type { StudyPlanData } from "@/lib/study-plan/study-plan-server";

type Props = {
  data: StudyPlanData;
};

export function StudyPlanContent({ data }: Props) {
  if (!data.isLoggedIn) {
    return (
      <div className="bs-study-plan-guest">
        <h1 className="bs-study-plan-title">Миний зорилго</h1>
        <p className="bs-study-plan-sub">
          Аль түвшинд, хэзээ гэхэд хүрэхээ тавиад өдөрт хэдэн үг цээжлэхээ сонго.
        </p>
        <MyStudySystem />
        <Link href="/login" className="bs-study-plan-login-btn">
          Нэвтрэх
        </Link>
        <Link href="/signup" className="bs-study-plan-signup-link">
          Бүртгүүлэх
        </Link>
      </div>
    );
  }

  return (
    <div className="bs-study-plan">
      <header className="bs-study-plan-head">
        <h1 className="bs-study-plan-title">Миний зорилго</h1>
        <p className="bs-study-plan-sub">{data.levelLabel}</p>
      </header>

      <MyStudySystem />

      <ExamGoalCard hideWhenUnset />

    </div>
  );
}
