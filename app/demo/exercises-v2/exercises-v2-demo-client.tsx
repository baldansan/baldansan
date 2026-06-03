"use client";

import { useState } from "react";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import {
  ListeningQuestion,
  MakeSentence,
  VocabCard,
  EXERCISE_PRIMARY,
} from "@/components/lesson-exercises";
import type { ExerciseResult } from "@/types/lesson-v2";

const DEMO_VOCAB = {
  id: "v_nihao",
  zh: "你好",
  pinyin: "nǐ hǎo",
  mn: "Сайн байна уу",
  example_zh: "你好！很高兴认识你。",
};

const DEMO_MAKE_SENTENCE = {
  n: 1,
  words: ["你好", "我", "是", "学生"],
  answer: "我是学生。",
};

const DEMO_LISTENING_TF = {
  n: 1,
  statement_zh: "他是老师。",
  answer: false,
};

const DEMO_LISTENING_MC = {
  n: 2,
  options: ["我是学生。", "你是老师。", "他是医生。", "她是朋友。"],
  answer: "A",
};

type LogEntry = {
  id: string;
  label: string;
  result: ExerciseResult;
  at: string;
};

export function ExercisesV2DemoClient() {
  const [log, setLog] = useState<LogEntry[]>([]);

  const record =
    (id: string, label: string) =>
    (result: ExerciseResult) => {
      setLog((prev) => [
        {
          id,
          label,
          result,
          at: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    };

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-slate-50 px-4 pb-12 pt-6">
      <Reveal>
        <header className="mb-6">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: EXERCISE_PRIMARY }}
        >
          Lesson v2 · Demo
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Interactive exercises
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          MakeSentence · ListeningQuestion · VocabCard — each reports{" "}
          <code className="rounded bg-slate-200 px-1 text-xs">onResult</code>.
        </p>
        </header>
      </Reveal>

      <RevealStagger className="space-y-8">
        <RevealItem>
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800">1. VocabCard</h2>
            <VocabCard word={DEMO_VOCAB} onResult={record("vocab", "VocabCard")} />
          </section>
        </RevealItem>

        <RevealItem>
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800">2. MakeSentence</h2>
            <MakeSentence
              item={DEMO_MAKE_SENTENCE}
              instructionMn="Үгсийг зөв дарааллаар сонгон өгүүлбэр бүтээнэ үү."
              onResult={record("make-sentence", "MakeSentence")}
            />
          </section>
        </RevealItem>

        <RevealItem>
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800">
              3. ListeningQuestion (true / false)
            </h2>
            <ListeningQuestion
              item={DEMO_LISTENING_TF}
              type="true_false"
              instructionMn="Өгүүлбэрийг уншаад зөв эсэхийг сонгоно уу."
              onResult={record("listening-tf", "Listening TF")}
            />
          </section>
        </RevealItem>

        <RevealItem>
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800">
              4. ListeningQuestion (multiple choice)
            </h2>
            <ListeningQuestion
              item={DEMO_LISTENING_MC}
              type="mc"
              instructionMn="Зөв хариултыг сонгоно уу."
              onResult={record("listening-mc", "Listening MC")}
            />
          </section>
        </RevealItem>
      </RevealStagger>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="text-sm font-bold text-slate-800">Result log</h2>
        {log.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Дасгал хийхэд энд харагдана.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {log.map((entry) => (
              <li
                key={`${entry.id}-${entry.at}-${entry.result.correct}`}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">{entry.label}</span>
                <span
                  className={
                    entry.result.correct
                      ? "font-semibold text-emerald-600"
                      : "font-semibold text-red-600"
                  }
                >
                  {entry.result.correct ? "correct" : "incorrect"} · {entry.at}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
