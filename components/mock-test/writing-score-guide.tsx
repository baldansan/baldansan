"use client";

import { useEffect, useState } from "react";
import type { MockTestQuestionRow } from "@/lib/mock-test/types";

/**
 * Бичих даалгаврын «оноотой жишээ» — ямар хариулт хэдэн оноо авахыг харуулна.
 * Бичих хэсгийг автоматаар шалгах боломжгүй тул сурагч «ингэж бичих ёстой юм байна» гэдгийг
 * жишээнээс харж сурна. Оноо нь манай 10 онооны хэмжүүр (албан онооны задаргаа биш) —
 * шалгагчийн хардаг шалгуурыг (үг хэрэглээ, агуулга, дүрэм, урт) дагасан.
 */

type Tier = { score: string; tone: "top" | "good" | "mid" | "low"; zh?: string; why: string };
type Guide = { title: string; intro: string; tiers: Tier[]; tip: string };

const PICTURE_SENTENCE: Guide = {
  title: "Ямар өгүүлбэр хэдэн оноо авах вэ?",
  intro: "Жишээ: өгөгдсөн үг «照相», зурагт цэцэрлэгт зураг авч буй охин байна гэж бодъё.",
  tiers: [
    {
      score: "9–10",
      tone: "top",
      zh: "她正在公园里给朋友照相。",
      why: "Үгийг зөв хэрэглэсэн, зурагтай таарсан. Хэн, хаана, юу хийж байгаа нь бүрэн. Алдаагүй.",
    },
    {
      score: "7–8",
      tone: "good",
      zh: "她在照相。",
      why: "Зөв өгүүлбэр, гэхдээ хэт богино — хаана, хэнд гэх мэт нэмэлт мэдээлэлгүй.",
    },
    {
      score: "5–6",
      tone: "mid",
      zh: "她照相在公园。",
      why: "Үг орсон ч үгийн дараалал буруу (газрын нэр үйл үгийн өмнө орно: 在公园照相).",
    },
    {
      score: "0–4",
      tone: "low",
      why: "Өгөгдсөн үгийг хэрэглээгүй, зурагтай холбоогүй, эсвэл ханзын алдаа олон.",
    },
  ],
  tip: "Бүтэн оноо авах томьёо: хэн + хаана/хэзээ + юу хийж байна. 10–15 ханз хангалттай — урт бичих тусам алдах магадлал өснө.",
};

const ESSAY: Guide = {
  title: "Ямар бичвэр хэдэн оноо авах вэ?",
  intro: "Шалгагч дөрвөн зүйл хардаг: даалгаврын шаардлага биелсэн эсэх, агуулга ба уялдаа, үг ба дүрэм, урт.",
  tiers: [
    {
      score: "9–10",
      tone: "top",
      why: "Шаардсан бүх үг / сэдэв орсон. Эхлэл–өрнөл–төгсгөлтэй нэг түүх. Шаардсан урт хүрсэн. 因为…所以, 虽然…但是, 后来, 于是 зэрэг холбоос үгтэй. Алдаа бараг үгүй.",
    },
    {
      score: "7–8",
      tone: "good",
      why: "Шаардлага биелсэн, урт хүрсэн. Гэхдээ өгүүлбэрүүд хоорондоо сул холбогдсон, эсвэл 1–3 дүрэм/ханзын алдаатай.",
    },
    {
      score: "5–6",
      tone: "mid",
      why: "Өгөгдсөн үгээс 1–2 нь дутуу, эсвэл урт дутуу (шаардсаны 70–80%). Алдаа олон ч утга ойлгогдоно.",
    },
    {
      score: "0–4",
      tone: "low",
      why: "Сэдвээс гадуур, шаардсан уртын талд ч хүрээгүй, эсвэл өгүүлбэрүүд ойлгогдохгүй.",
    },
  ],
  tip: "Эхлээд 3 мөр төлөвлөгөө гарга (хэн/хаана → юу болсон → яаж дууссан, юу бодсон). Мэддэг үг, бүтцээрээ бич — хэцүү үг буруу хэрэглэснээс энгийн зөв өгүүлбэр илүү оноо авна.",
};

const ESSAY_PICTURE: Guide = {
  ...ESSAY,
  intro: "Шалгагч дөрвөн зүйл хардаг: зурагтай холбогдсон эсэх, агуулга ба уялдаа, үг ба дүрэм, урт.",
  tiers: ESSAY.tiers.map((tier, i) =>
    i === 0
      ? {
          ...tier,
          why: "Зураг дээрх хүн, газар, үйл явдал бүгд орсон. Эхлэл–өрнөл–төгсгөлтэй. Шаардсан урт хүрсэн, холбоос үгтэй. Алдаа бараг үгүй.",
        }
      : i === 3
        ? { ...tier, why: "Зурагтай холбоогүй, шаардсан уртын талд ч хүрээгүй, эсвэл өгүүлбэрүүд ойлгогдохгүй." }
        : tier
  ),
};

const SUMMARY: Guide = {
  title: "Ямар хураангуй хэдэн оноо авах вэ?",
  intro: "缩写: 1000 орчим ханзтай эхийг уншаад 400 орчим ханзаар товчилно. Өөрийн бодол нэмэхгүй.",
  tiers: [
    {
      score: "9–10",
      tone: "top",
      why: "Гарчигтай. Хэн, хаана, юу болсон, яаж дууссан — гол үйл явдал бүгд дарааллаараа орсон. 400 орчим ханз. Өөрийн үгээр бичсэн, алдаа бараг үгүй.",
    },
    {
      score: "7–8",
      tone: "good",
      why: "Гол үйл явдал орсон ч нэг чухал хэсэг дутуу, эсвэл 1–3 алдаатай. Урт нь ойролцоо.",
    },
    {
      score: "5–6",
      tone: "mid",
      why: "Түүхийн тал нь л орсон, эсвэл 300-аас бага ханз. Жижиг дэлгэрэнгүйд хэт их зай зарцуулсан.",
    },
    {
      score: "0–4",
      tone: "low",
      why: "Өөрийн бодол, дүгнэлт нэмсэн; эхээс өөр түүх болсон; эсвэл гарчиггүй, маш богино.",
    },
  ],
  tip: "Уншихдаа 6 зүйлийг тэмдэглэ: хэн, хэзээ, хаана, яагаад, юу болсон, үр дүн. Яриа, тодотгол, жижиг дэлгэрэнгүйг хас.",
};

const SEEN_KEY = "bs.wsg.seen.v1";

function guideFor(question: MockTestQuestionRow): Guide | null {
  if (question.autograde !== "manual") return null;
  // Уншлагын товч хариулт, орчуулга зэрэг нь бичгийн даалгавар биш.
  if (question.skill !== "writing") return null;
  if ((question.tags ?? []).some((tag) => tag.startsWith("sk.translation"))) return null;
  switch (question.q_type) {
    case "picture_sentence":
      return PICTURE_SENTENCE;
    case "essay":
      return ESSAY;
    case "essay_picture":
      return ESSAY_PICTURE;
    case "summary":
      return SUMMARY;
    default:
      return null;
  }
}

export function WritingScoreGuide({ question }: { question: MockTestQuestionRow }) {
  const guide = guideFor(question);
  // Анх удаа дэлгээстэй харагдана; нэг үзсэний дараа эвхээстэй (дарж нээнэ) — бичих талбарыг доош түлхэхгүй.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SEEN_KEY) !== "1") {
        setOpen(true);
        window.localStorage.setItem(SEEN_KEY, "1");
      }
    } catch {
      setOpen(true);
    }
  }, []);
  if (!guide) return null;
  return (
    <details className="bs-wsg" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="bs-wsg-head">
        <span>📊 {guide.title}</span>
        <span className="bs-wsg-chev" aria-hidden>
          ▾
        </span>
      </summary>
      <p className="bs-wsg-intro">{guide.intro}</p>
      <ul className="bs-wsg-list">
        {guide.tiers.map((tier) => (
          <li key={tier.score} className={`bs-wsg-tier bs-wsg-tier--${tier.tone}`}>
            <span className="bs-wsg-score">
              {tier.score}
              <small>оноо</small>
            </span>
            <span className="bs-wsg-body">
              {tier.zh ? (
                <span className="bs-wsg-zh hanzi" translate="no">
                  {tier.zh}
                </span>
              ) : null}
              <span className="bs-wsg-why">{tier.why}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="bs-wsg-tip">💡 {guide.tip}</p>
      <p className="bs-wsg-note">Оноо нь манай 10 онооны хэмжүүр — шалгагчийн хардаг шалгуурыг дагасан.</p>
    </details>
  );
}
