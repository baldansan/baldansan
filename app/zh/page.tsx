import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata = {
  title: "应用介绍 — Бөөндөө Сурцгаая",
  description: "蒙古学生的汉语学习应用 — 教师评估指南",
};

const sections = [
  {
    title: "这是什么应用？",
    body: "«Бөөндөө Сурцгаая» 是一款为蒙古学习者设计的汉语学习应用。课程以 HSK 标准教材为基础，每一课包含：课文（带拼音和蒙古语翻译）、生词、语法注释、练习、听力（配官方音频）以及约34道测验题。",
  },
  {
    title: "写字练习",
    body: "应用内置田字格写字练习：学习者先跟着笔顺描写，然后凭记忆书写（不显示轮廓），系统实时判断每一笔是否正确。写字课程按 HSK 3.0《手写字表》分级，共1200个汉字。",
  },
  {
    title: "复习系统",
    body: "生词通过间隔重复系统（SRS）复习：认识 / 犹豫 / 忘了 三档评分，自动安排复习时间。另有配对、选义、拼音、部件拆解等小游戏帮助巩固。",
  },
  {
    title: "请老师评估什么？",
    body: "1) 课文的中文和拼音是否准确；2) 练习答案是否正确；3) 写字判定是否合理；4) 语法解释（蒙古语）所配的中文例句是否自然；5) 音频与文本是否一致。发现问题请点击应用右下角的 💬 按钮反馈，或直接告诉 Baldansan。",
  },
];

export default function ChineseIntroPage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          应用介绍 / 教师指南
        </h1>
        <p className="mt-2 text-slate-600">
          Багш нарт зориулсан хятад хэл дээрх танилцуулга
        </p>
      </section>

      <div className="flex flex-col gap-4">
        {sections.map((s) => (
          <article
            key={s.title}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl"
          >
            <h2 className="font-semibold text-slate-900">{s.title}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">{s.body}</p>
          </article>
        ))}
      </div>

      <section className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/courses"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white"
        >
          开始体验 / Эхлэх
        </Link>
      </section>
    </PublicPageShell>
  );
}
