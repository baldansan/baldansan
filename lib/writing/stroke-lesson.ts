/**
 * «Зурлагын үндэс» богино хичээлийн агуулга.
 * Сурагчид хятад нэр томьёо ХАРУУЛАХГҮЙ — зөвхөн монгол нэр, тайлбар.
 * Зурлага бүрийг жинхэнэ ханзны нэг зураасаар үзүүлнэ (`ch`-ийн `idx` дэх зураас, 0-ээс).
 */
import type { StrokeKindId } from "@/lib/writing/stroke-kind";

export type StrokeLessonItem = {
  id: StrokeKindId;
  name: string;
  /** Яаж зурах. */
  how: string;
  /** Жишээ ханз ба түүний аль зураас. */
  ch: string;
  idx: number;
  /** Энэ зурлага бүхий өөр ханзууд. */
  seenIn: string[];
};

export const STROKE_LESSON: StrokeLessonItem[] = [
  { id: "dot", name: "Цэг", how: "Үзгээ тавиад баруун доош богино дарна.", ch: "主", idx: 0, seenIn: ["六", "小", "太"] },
  { id: "heng", name: "Хэвтээ", how: "Зүүнээс баруун тийш татна.", ch: "一", idx: 0, seenIn: ["二", "三", "十"] },
  { id: "shu", name: "Босоо", how: "Дээрээс доош шулуун татна.", ch: "十", idx: 1, seenIn: ["中", "上", "工"] },
  { id: "pie", name: "Зүүн налуу", how: "Баруун дээрээс зүүн доош татаж, төгсгөлд нь хөнгөлж шовхолно.", ch: "人", idx: 0, seenIn: ["八", "大", "不"] },
  { id: "na", name: "Баруун налуу", how: "Зүүн дээрээс баруун доош татаж, төгсгөлд нь дарж өргөсгөнө.", ch: "人", idx: 1, seenIn: ["八", "大", "天"] },
  { id: "ti", name: "Өргөлт", how: "Зүүн доороос баруун дээш хурдан шувтална.", ch: "地", idx: 2, seenIn: ["我", "打", "习"] },
  { id: "fold", name: "Нугалаас", how: "Хэвтээ татаад үзгээ өргөлгүй булан гаргаж доош эргэнэ.", ch: "口", idx: 1, seenIn: ["日", "五", "山"] },
  { id: "hook", name: "Дэгээ", how: "Босоо татаад төгсгөлд нь зүүн дээш жижиг дэгээ гаргана.", ch: "小", idx: 0, seenIn: ["水", "你", "子"] },
];

export type StrokeOrderRule = {
  title: string;
  detail: string;
  ch: string;
  /** Эхэлж бичигдэх зураасууд (тодруулж харуулна). */
  first: number[];
};

export const STROKE_ORDER_RULES: StrokeOrderRule[] = [
  { title: "Дээрээс доош", detail: "Дээд зурааснаас эхэлж доошилно.", ch: "三", first: [0] },
  { title: "Зүүнээс баруун", detail: "Зүүн талын хэсгээс эхэлж баруун тийш явна.", ch: "川", first: [0] },
  { title: "Хэвтээг босооноос өмнө", detail: "Огтлолцсон бол эхлээд хэвтээ, дараа нь босоо.", ch: "十", first: [0] },
  { title: "Зүүн налууг баруун налуугаас өмнө", detail: "Хоёр тийш задарсан бол зүүн нь эхэлнэ.", ch: "人", first: [0] },
  { title: "Гаднаас дотогш, хаалтаа сүүлд", detail: "Хүрээгээ зураад дотрыг нь бөглөж, доод зураасаар хаана.", ch: "国", first: [0, 1] },
  { title: "Голоо эхэлж, хоёр хажуугаа дараа", detail: "Тэгш хэмтэй ханзны гол зураас түрүүлнэ.", ch: "小", first: [0] },
];

/** Хичээлийн төгсгөлд дагаж зурах ханзууд. */
export const STROKE_LESSON_TRY = ["十", "人", "口", "小"];

export const STROKE_LESSON_KEY = "buunduu-strokes-lesson-v1";

export type StrokeLessonState = { done: StrokeKindId[]; finished: boolean };

export function readStrokeLessonState(): StrokeLessonState {
  if (typeof window === "undefined") return { done: [], finished: false };
  try {
    const raw = window.localStorage.getItem(STROKE_LESSON_KEY);
    if (!raw) return { done: [], finished: false };
    const parsed = JSON.parse(raw) as Partial<StrokeLessonState>;
    return {
      done: Array.isArray(parsed.done) ? parsed.done : [],
      finished: Boolean(parsed.finished),
    };
  } catch {
    return { done: [], finished: false };
  }
}

export function writeStrokeLessonState(state: StrokeLessonState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STROKE_LESSON_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
