"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/supabase/auth";

const POINTS = [
  { icon: "👥", title: "Ангиа үүсгэ", text: "6 оронтой кодоор сурагчид өөрсдөө нэгдэнэ." },
  { icon: "📝", title: "Даалгавар өг", text: "Сурагчийн нүүрэнд «ЗААВАЛ» гэж гарна." },
  { icon: "📊", title: "Хэн яаж байгааг хар", text: "Сайн, дунд, хоцорсон, ороогүй — өнгөөр." },
  { icon: "🏢", title: "Сургалтын төв", text: "Эрхлэгч бүх багш, ангиа нэг дороос харна." },
];

/**
 * /teacher — багш, сургалтын төвийн тусдаа орох хаалга.
 * Нэвтэрсэн бол шууд «Өнөөдөр» рүү; үгүй бол нэвтрэх/бүртгүүлэх.
 */
export function TeacherPortalEntry() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    void getCurrentUser().then(({ data }) => {
      if (!alive) return;
      if (data) router.replace("/teacher/today");
      else setChecked(true);
    });
    return () => {
      alive = false;
    };
  }, [router]);

  if (!checked) {
    return <p className="text-sm text-slate-500">Ачаалж байна…</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4">
      <section className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-emerald-100 sm:p-10">
        <p className="text-5xl" aria-hidden>
          🧑‍🏫
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Багш, сургалтын төвийн самбар
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Энд зөвхөн таны өөрийн анги, сурагч, даалгавар харагдана. Сургалтын төвийн эрхлэгч бол
          төвийнхөө бүх багш, ангийг харна.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login?next=/teacher/today"
            className="rounded-full bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
          >
            Нэвтрэх
          </Link>
          <Link
            href="/signup?next=/teacher/today"
            className="rounded-full bg-white px-7 py-3 text-sm font-bold text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-50"
          >
            Багшаар бүртгүүлэх
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Сургалтын төвөөс урилга авсан бол урилгын холбоосоороо орж бүртгүүлнэ үү.
        </p>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2">
        {POINTS.map((p) => (
          <li key={p.title} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
            <span className="text-2xl" aria-hidden>
              {p.icon}
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-900">{p.title}</span>
              <span className="text-[13px] leading-5 text-slate-600">{p.text}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-slate-500">
        Сургалтын төвөө бүртгүүлэх бол:{" "}
        <Link href="/school-inquiry" className="font-semibold text-emerald-700 hover:underline">
          хамтран ажиллах хүсэлт илгээх →
        </Link>
      </p>
    </div>
  );
}
