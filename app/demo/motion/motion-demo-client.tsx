"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AnimatedProgressBar,
  CountUp,
  ExerciseFeedback,
  MotionButton,
  MotionCard,
  PageTransition,
  Reveal,
  RevealItem,
  RevealStagger,
  VocabFlipCard,
} from "@/components/motion";
import { EXERCISE_PRIMARY } from "@/components/lesson-exercises/exercise-theme";

const INTEGRATION_MAP = [
  {
    component: "PageTransition",
    wraps: "Review step content (`today-review-client.tsx`)",
    when: "transitionKey = review row id",
  },
  {
    component: "Reveal / RevealStagger",
    wraps: "Demo & future lesson module lists",
    when: "On mount / stagger children",
  },
  {
    component: "ExerciseFeedback",
    wraps: "MakeSentence, ListeningQuestion root",
    when: "status idle | correct | wrong",
  },
  {
    component: "VocabFlipCard",
    wraps: "VocabCard front/back faces",
    when: "3D flip on tap",
  },
  {
    component: "MotionButton",
    wraps: "Exercise tiles, CTAs, SRS rating buttons",
    when: "whileTap scale 0.97",
  },
  {
    component: "AnimatedProgressBar + CountUp",
    wraps: "LessonProgressCard",
    when: "Progress percent changes",
  },
  {
    component: "MotionCard",
    wraps: "Future: timeline cards, game tiles (not wired yet)",
    when: "Interactive card press",
  },
];

export function MotionDemoClient() {
  const [pageKey, setPageKey] = useState("a");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [progress, setProgress] = useState(35);
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-slate-50 px-4 pb-16 pt-6">
      <Reveal>
        <header className="mb-8">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: EXERCISE_PRIMARY }}
          >
            Motion layer
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Transition components
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Subtle Framer Motion via{" "}
            <code className="rounded bg-slate-200 px-1 text-xs">motion/react</code>.
            All respect{" "}
            <code className="rounded bg-slate-200 px-1 text-xs">
              prefers-reduced-motion
            </code>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/demo/exercises-v2" className="font-semibold text-emerald-700">
              Exercises demo →
            </Link>
            <Link href="/review/today" className="font-semibold text-emerald-700">
              SRS review →
            </Link>
          </div>
        </header>
      </Reveal>

      <RevealStagger className="space-y-10">
        <RevealItem>
          <section>
            <h2 className="mb-2 text-sm font-bold text-slate-800">
              PageTransition
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              Fade + 8px slide-up, 200ms
            </p>
            <div className="flex gap-2">
              <MotionButton
                onClick={() => setPageKey("a")}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold"
              >
                Module A
              </MotionButton>
              <MotionButton
                onClick={() => setPageKey("b")}
                className="rounded-full px-4 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: EXERCISE_PRIMARY }}
              >
                Module B
              </MotionButton>
            </div>
            <PageTransition transitionKey={pageKey}>
              <div className="mt-3 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <p className="text-lg font-semibold text-slate-900">
                  {pageKey === "a" ? "你好 — Hook module" : "语法 — Grammar module"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Lesson module placeholder content.
                </p>
              </div>
            </PageTransition>
          </section>
        </RevealItem>

        <RevealItem>
          <section>
            <h2 className="mb-2 text-sm font-bold text-slate-800">Press feedback</h2>
            <div className="flex flex-wrap gap-2">
              <MotionButton
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: EXERCISE_PRIMARY }}
              >
                MotionButton
              </MotionButton>
              <MotionCard
                as="button"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold ring-1 ring-slate-200"
              >
                MotionCard
              </MotionCard>
            </div>
          </section>
        </RevealItem>

        <RevealItem>
          <section>
            <h2 className="mb-2 text-sm font-bold text-slate-800">
              ExerciseFeedback
            </h2>
            <ExerciseFeedback
              status={feedback}
              className="rounded-2xl bg-white p-6 ring-1 ring-slate-200"
            >
              <p className="text-center text-slate-700">Tap to simulate answer</p>
              <div className="mt-4 flex justify-center gap-2">
                <MotionButton
                  onClick={() => setFeedback("correct")}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white"
                >
                  Correct
                </MotionButton>
                <MotionButton
                  onClick={() => setFeedback("wrong")}
                  className="rounded-full bg-red-100 px-4 py-2 text-xs font-bold text-red-700"
                >
                  Wrong
                </MotionButton>
                <MotionButton
                  onClick={() => setFeedback("idle")}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Reset
                </MotionButton>
              </div>
            </ExerciseFeedback>
          </section>
        </RevealItem>

        <RevealItem>
          <section>
            <h2 className="mb-2 text-sm font-bold text-slate-800">VocabFlipCard</h2>
            <VocabFlipCard
              flipped={flipped}
              onFlip={() => setFlipped((v) => !v)}
              front={
                <div className="py-6">
                  <span className="text-5xl font-bold">学</span>
                  <p className="mt-2 text-xs text-slate-400">Tap to flip</p>
                </div>
              }
              back={
                <div className="py-4">
                  <p className="text-lg font-medium text-emerald-600">xué</p>
                  <p className="text-sm text-slate-700">сурах</p>
                </div>
              }
            />
          </section>
        </RevealItem>

        <RevealItem>
          <section>
            <h2 className="mb-2 text-sm font-bold text-slate-800">Progress</h2>
            <AnimatedProgressBar value={progress} />
            <p className="mt-2 text-sm text-emerald-700">
              <CountUp value={progress} suffix="%" />
            </p>
            <MotionButton
              onClick={() => setProgress((p) => (p >= 100 ? 20 : p + 15))}
              className="mt-3 rounded-full px-4 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: EXERCISE_PRIMARY }}
            >
              +15% progress
            </MotionButton>
          </section>
        </RevealItem>

        <RevealItem>
          <section>
            <h2 className="mb-3 text-sm font-bold text-slate-800">
              Where components wrap existing UI
            </h2>
            <ul className="space-y-2">
              {INTEGRATION_MAP.map((row) => (
                <li
                  key={row.component}
                  className="rounded-xl bg-white p-3 text-xs ring-1 ring-slate-200"
                >
                  <p className="font-bold text-slate-900">{row.component}</p>
                  <p className="mt-1 text-slate-600">
                    <span className="font-medium">Wraps:</span> {row.wraps}
                  </p>
                  <p className="text-slate-500">{row.when}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Not yet wired: HSK guided player steps, home timeline cards, games hub —
              use the same primitives when those pages are polished.
            </p>
          </section>
        </RevealItem>
      </RevealStagger>
    </div>
  );
}
