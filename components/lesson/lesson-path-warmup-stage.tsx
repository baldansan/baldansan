"use client";

import { useState } from "react";
import DialoguesModule from "@/components/lesson/modules/DialoguesModule";
import PronunciationModule from "@/components/lesson/modules/PronunciationModule";
import { baldanLine } from "@/lib/temee/baldan-lines";
import { BaldanSay } from "@/components/lesson/baldan-say";
import "./lesson-fresh.css";
import type { LessonPathPlan } from "@/lib/lesson/build-lesson-path";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";
import { lessonDisplayTitleMn } from "@/lib/course-display-meta";
import { DeepPronunciationPanel } from "@/components/lesson/deep/deep-teaching-blocks";
import type { LessonDeepTeaching } from "@/types/lesson-deep-teaching";
import type {
  LessonPathImage,
  LessonPathImages,
} from "@/lib/lesson/lesson-path-images";

/** section="warmup" зураг — товшиж нээх (нэр нь эхэндээ далд). */
function WarmupRevealFigure({ img }: { img: LessonPathImage }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <figure
      className="bs-tm-illus-item"
      role="button"
      tabIndex={0}
      aria-pressed={revealed}
      onClick={() => setRevealed(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setRevealed(true);
        }
      }}
      style={{ cursor: revealed ? "default" : "pointer" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase public URL */}
      <img src={img.url} alt="" loading="lazy" decoding="async" />
      <figcaption translate="no">
        {revealed ? img.title : "Энэ юу вэ? 👆"}
      </figcaption>
    </figure>
  );
}

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

/**
 * Resolver-ийн "Сайн уу." / тайлбар fallback биш, жинхэнэ багшийн оршил эсэх.
 * Хичээл бүтээгчийн дотоод жагсаалт («5 课文 + 32 үг + 5 дүрэм + 选词填空 …») сурагчид хэрэггүй тул
 * оршилд тооцохгүй: олон «+»-тэй эсвэл «Багшийн давхарга» гэсэн тэмдэглэлтэй бол нууна.
 */
function hasRealTeacherIntro(text: string | undefined): boolean {
  const t = (text ?? "").trim();
  if (t.length <= 40) return false;
  if ((t.match(/\s\+\s/g) ?? []).length >= 3) return false;
  if (/Багшийн давхарга|课文\s*\(|选词填空/.test(t)) return false;
  return true;
}

/**
 * Халаалтын урт догол мөрөөс асуултын өгүүлбэрийг ялгана (агуулгыг өөрчлөхгүй — зөвхөн аль хэсгийг
 * том харуулахаа сонгоно). Асуулт олдохгүй бол бүтэн текстийг тэр чигт нь асуулт болгоно.
 */
function splitWarmup(text: string | null): { question: string; full: string; rest: boolean } | null {
  if (!text) return null;
  const quoted = text.match(/[«“"]([^«»“”"]*[?？][^«»“”"]*)[»”"]/);
  let question = quoted?.[1]?.trim() ?? "";
  if (!question) {
    const sentences = text.split(/(?<=[.!?。！？])\s+/).map((x) => x.trim()).filter(Boolean);
    question = sentences.find((x) => /[?？]/.test(x)) ?? "";
  }
  if (!question || text.length <= 140) return { question: text, full: text, rest: false };
  return { question, full: text, rest: true };
}

function count<T>(arr: T[] | undefined): number {
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

  const warmup = splitWarmup(warmupQuestion);

  return (
    <div className="bs-path-warmup">
      {hero ? (
        <figure className="bs-tm-hero">
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase public URL, хэмжээ урьдчилж мэдэгдэхгүй */}
          <img src={hero.url} alt={hero.title} loading="lazy" decoding="async" />
          <figcaption translate="no">{hero.title}</figcaption>
        </figure>
      ) : null}
      <div className="bs-fresh-title">
        <p className="bs-fresh-kicker">
          {lesson.level} · {lesson.lesson_number}-р хичээл
        </p>
        <h2 className="bs-fresh-zh" translate="no">{lesson.title.zh}</h2>
        <p className="bs-fresh-mn" translate="no">{lessonDisplayTitleMn(lesson.title.mn)}</p>
      </div>

      <div className="bs-fresh-stats">
        {vocabN > 0 ? (
          <div><b>{vocabN}</b><span>шинэ үг</span></div>
        ) : null}
        {grammarN > 0 ? (
          <div><b>{grammarN}</b><span>дүрэм</span></div>
        ) : null}
        <div><b>~{plan.totalMinutes}</b><span>минут</span></div>
      </div>

      {teacherIntro ? (
        <p className="bs-fresh-teacher" translate="no">{teacherIntro}</p>
      ) : null}

      {warmup ? (
        <div className="bs-fresh-q">
          <p className="bs-fresh-q-head">Эхлээд нэг асуулт</p>
          <p className="bs-fresh-q-text" translate="no">{warmup.question}</p>
          {warmup.rest ? (
            <details className="bs-fresh-q-more">
              <summary>Бүтэн халаалтыг харах</summary>
              <p translate="no">{warmup.full}</p>
            </details>
          ) : null}
        </div>
      ) : null}

      {illustrations.length > 0 ? (
        <div className="bs-tm-illus">
          <div className="bs-tm-warm-head">🖼️ Энэ хичээлд гарах зүйлс</div>
          <div className="bs-tm-illus-grid">
            {illustrations.map((img) =>
              img.section?.trim().toLowerCase() === "warmup" ? (
                <WarmupRevealFigure key={img.id} img={img} />
              ) : (
              <figure key={img.id} className="bs-tm-illus-item">
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase public URL */}
                <img src={img.url} alt={img.title} loading="lazy" decoding="async" />
                <figcaption translate="no">{img.title}</figcaption>
              </figure>
              )
            )}
          </div>
        </div>
      ) : null}

      <BaldanSay pose="think" text={baldanLine("lessonStart", lesson.lesson_number)} />

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
