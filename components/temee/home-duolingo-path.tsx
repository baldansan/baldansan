"use client";

import Image from "next/image";
import Link from "next/link";
import { TEMEE_ASSETS } from "@/lib/temee/assets";
import { lessonPath } from "@/lib/content";
import type { LessonContent } from "@/types/lesson-content";
import type { LessonStatus } from "@/lib/progress";

type NodeState = "done" | "current" | "locked";

type Props = {
  lessons: LessonContent[];
  statusByLesson: Record<string, LessonStatus>;
  allLessonsHref?: string | null;
  maxNodes?: number;
};

const ALIGN = [
  "bs-tm-path-cell--left",
  "bs-tm-path-cell--center",
  "bs-tm-path-cell--right",
] as const;

function resolveNodeState(
  lessons: LessonContent[],
  statusByLesson: Record<string, LessonStatus>,
  index: number
): NodeState {
  const lesson = lessons[index];
  const status = statusByLesson[lesson.id] ?? "not_started";
  if (status === "completed") return "done";

  const firstOpen = lessons.findIndex((l, i) => {
    const s = statusByLesson[l.id] ?? "not_started";
    if (s === "completed") return false;
    if (l.status === "locked") return false;
    if (i === 0) return true;
    const prev = lessons[i - 1];
    const prevStatus = statusByLesson[prev.id] ?? "not_started";
    return prevStatus === "completed" || prevStatus === "started";
  });

  if (index === firstOpen) return "current";
  return "locked";
}

export function HomeDuolingoPath({
  lessons,
  statusByLesson,
  allLessonsHref,
  maxNodes = 6,
}: Props) {
  const nodes = lessons.slice(0, maxNodes);

  if (nodes.length === 0) {
    return (
      <p className="bs-tm-path-empty">
        Одоогоор хичээл алга. Import ZIP-ээр нэмнэ үү.
      </p>
    );
  }

  return (
    <div className="bs-tm-path-wrap">
      <div className="bs-tm-path">
        {nodes.map((lesson, index) => {
          const state = resolveNodeState(nodes, statusByLesson, index);
          const align = ALIGN[index % 3];
          const isLast = index === nodes.length - 1;

          const nodeEl =
            state === "locked" ? (
              <div className={`bs-tm-path-node bs-tm-path-node--locked ${align}`}>
                <span className="bs-tm-path-node-inner" aria-hidden>
                  🔒
                </span>
              </div>
            ) : state === "current" ? (
              <Link
                href={lessonPath(lesson.id)}
                className={`bs-tm-path-node bs-tm-path-node--current ${align}`}
              >
                <span className="bs-tm-path-node-inner" aria-hidden>
                  ▶
                </span>
              </Link>
            ) : (
              <Link
                href={lessonPath(lesson.id)}
                className={`bs-tm-path-node bs-tm-path-node--done ${align}`}
              >
                <span className="bs-tm-path-node-inner" aria-hidden>
                  ✓
                </span>
              </Link>
            );

          return (
            <div key={lesson.id} className="bs-tm-path-step">
              {!isLast ? <div className="bs-tm-path-connector" aria-hidden /> : null}
              {nodeEl}
              <p className={`bs-tm-path-label ${align}`}>
                <span className="hanzi">{lesson.chineseTitle}</span>
                <span className="bs-tm-path-label-mn">{lesson.title}</span>
              </p>
            </div>
          );
        })}
      </div>
      <Image
        src={TEMEE_ASSETS.point}
        alt=""
        width={72}
        height={72}
        className="bs-tm-path-temee"
        aria-hidden
      />
      {allLessonsHref ? (
        <Link href={allLessonsHref} className="bs-tm-path-all">
          Бүх хичээл харах →
        </Link>
      ) : null}
    </div>
  );
}
