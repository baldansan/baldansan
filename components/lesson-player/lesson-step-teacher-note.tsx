"use client";

import {
  LessonPlayerCard,
  TeacherBubble,
} from "@/components/lesson-player/lesson-player-shell";

type Props = {
  title: string;
  body: string;
};

export function LessonStepTeacherNote({ title, body }: Props) {
  const lines = body.split("\n").filter(Boolean);

  return (
    <LessonPlayerCard>
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      <div className="mt-5">
        <TeacherBubble>
          {lines.length > 1 ? (
            <ul className="space-y-2">
              {lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p>{body}</p>
          )}
        </TeacherBubble>
      </div>
    </LessonPlayerCard>
  );
}
