"use client";

import DialoguesModule from "@/components/lesson/modules/DialoguesModule";
import PronunciationModule from "@/components/lesson/modules/PronunciationModule";
import { TemeeEmojiIcon } from "@/components/temee/temee-emoji-icon";
import type { LessonPathPlan } from "@/lib/lesson/build-lesson-path";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";
import { lessonDisplayTitleMn } from "@/lib/course-display-meta";
import { DeepPronunciationPanel } from "@/components/lesson/deep/deep-teaching-blocks";
import type { LessonDeepTeaching } from "@/types/lesson-deep-teaching";
import type { LessonPathImages } from "@/lib/lesson/lesson-path-images";

type Props = {
  lesson: HskLessonPackage;
  plan: LessonPathPlan;
  onStart?: () => void;
  /** Full warmup stage: dialogues / pronunciation modules after intro */
  showWarmupModules?: boolean;
  /** Нэмэлт, гүнзгий тайлбар — байхгүй бол юу ч өөрчлөгдөхгүй. */
  deep?: LessonDeepTeaching | null;
  /** Багцын зураг (hero + зурагт тайлбар) — байхгүй бол юу ч өөрчлөгдөхгүй. */
  images?: LessonPathImages | null;
};

/** Resolver-ийн "Сайн уу." / тайлбар fallback биш, жинхэнэ багшийн оршил эсэх. */
function hasRealTeacherIntro(text: string | undefined): boolean {
  const t = (text ?? "").trim();
  return t.length > 40;
}

function count<T>(arr: T[] | undefined): number {
  return Array.isArray(arr) ? arr.length : 0;
}

function countUnknown(arr: unknown): number {
  return Array.isArray(arr) ? arr.length : 0;
}

export function LessonPathWarmupStage({
  lesson,
  plan,
  onStart,
  showWarmupModules = false,
  deep = null,
  images = null,
}: Props) {
  const teacherIntro = hasRealTeacherIntro(lesson.hook?.teacher_mn)
    ? lesson.hook.teacher_mn.trim()
    : null;
  const warmupQuestion = lesson.hook?.warmup_mn?.trim() || null;
  const hero = images?.hero ?? null;
  const illustrations = images?.illustrations ?? [];
  const vocabN = count(lesson.vocabulary);
  const grammarN = count(lesson.grammar);
  const dialogueN = count(lesson.dialogues);
  const exerciseN =
    countUnknown(lesson.exercises_workbook) +
    countUnknown(lesson.exercises_textbook);
  const warmWords = (lesson.vocabulary ?? []).slice(0, 3);

  const goals: { icon: string; bg: string; title: string; sub: string }[] = [];
  if (vocabN > 0) {
    goals.push({
      icon: "💡",
      bg: "#e4f0ff",
      title: `${vocabN} шинэ үг`,
      sub: "Сонсох, унших, бичих",
    });
  }
  if (dialogueN > 0 || plan.warmupExtras.includes("dialogues")) {
    goals.push({
      icon: "🗣️",
      bg: "#e3f7eb",
      title: `${dialogueN || 1} яриа`,
      sub: "Subtitle ба shadowing",
    });
  }
  if (grammarN > 0 || exerciseN > 0) {
    goals.push({
      icon: "🧩",
      bg: "#efe6ff",
      title: "Дүрмийн дасгал",
      sub: `${exerciseN || grammarN} асуулт`,
    });
  }

  return (
    <div className="bs-path-warmup">
      {hero ? (
        <figure className="bs-tm-hero">
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase public URL, хэмжээ урьдчилж мэдэгдэхгүй */}
          <img src={hero.url} alt={hero.title} loading="lazy" />
          <figcaption translate="no">{hero.title}</figcaption>
        </figure>
      ) : null}
      <div className="bs-tm-intro">
        <TemeeEmojiIcon
          variant="teach"
          className="bs-tm-intro-img"
          width={150}
          height={150}
          emojiScale={0.42}
        />
      </div>

      <div className="bs-tm-intro-bubble">
        <p className="bs-tm-intro-bubble-title">
          Сайн уу! Өнөөдөр бид{" "}
          <span className="font-[family-name:var(--font-noto-sc)] text-[#018242]">
            {lesson.title.zh}
          </span>{" "}
          сурна 🌸
        </p>
        <p className="bs-tm-intro-bubble-sub">
          «<span translate="no">{lessonDisplayTitleMn(lesson.title.mn)}</span>» — {lesson.level}{" "}
          {lesson.lesson_number}-р хичээл
        </p>
        {teacherIntro ? (
          <p className="bs-tm-intro-bubble-teacher" translate="no">
            {teacherIntro}
          </p>
        ) : null}
      </div>

      {warmupQuestion ? (
        <div className="bs-tm-warmup-q">
          <div className="bs-tm-warm-head">🗣️ Халаалт — эхлээд бодоод үзье</div>
          <p translate="no">{warmupQuestion}</p>
        </div>
      ) : null}

      {illustrations.length > 0 ? (
        <div className="bs-tm-illus">
          <div className="bs-tm-warm-head">🖼️ Энэ хичээлд гарах зүйлс</div>
          <div className="bs-tm-illus-grid">
            {illustrations.map((img) => (
              <figure key={img.id} className="bs-tm-illus-item">
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase public URL */}
                <img src={img.url} alt={img.title} loading="lazy" />
                <figcaption translate="no">{img.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}

      {goals.length > 0 ? (
        <>
          <p className="bs-tm-sec">🎯 Өнөөдрийн зорилго</p>
          <div className="bs-tm-goal-list">
            {goals.map((goal) => (
              <div key={goal.title} className="bs-tm-goal-item">
                <div
                  className="bs-tm-goal-ic"
                  style={{ background: goal.bg }}
                  aria-hidden
                >
                  {goal.icon}
                </div>
                <div>
                  <div className="bs-tm-goal-title">{goal.title}</div>
                  <div className="bs-tm-goal-sub">{goal.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {warmWords.length > 0 ? (
        <div className="bs-tm-warm">
          <div className="bs-tm-warm-head">🔥 Эхлэхийн өмнө санацгаая</div>
          <div className="bs-tm-warm-words">
            {warmWords.map((word) => (
              <div key={word.id ?? word.zh} className="bs-tm-warm-word">
                <div className="bs-tm-warm-word-zh">{word.zh}</div>
                <div className="bs-tm-warm-word-mn" translate="no">
                  {word.meaning_mn ?? word.mn}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {onStart ? (
        <button type="button" className="bs-tm-start-btn" onClick={onStart}>
          Эхлэх →
        </button>
      ) : null}

      {showWarmupModules && plan.warmupExtras.includes("dialogues") ? (
        <DialoguesModule lesson={lesson} onDone={() => {}} />
      ) : null}
      {showWarmupModules && deep?.pronunciation ? (
        <DeepPronunciationPanel pronunciation={deep.pronunciation} />
      ) : null}
      {showWarmupModules && plan.warmupExtras.includes("pronunciation") ? (
        <PronunciationModule lesson={lesson} onDone={() => {}} />
      ) : null}
    </div>
  );
}
