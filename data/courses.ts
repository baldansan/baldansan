import type { Course } from "@/types/course";

/** Static catalog placeholders; live HSK/Korean courses come from Supabase. */
export const courses: Course[] = [
  {
    id: "taobao",
    title: "Taobao Chinese",
    level: "Practical",
    description:
      "Таобао, 拼多多, 得物 дээр хэрэглэгдэх бодит хятад үг, өгүүлбэрүүд.",
    lessons: 0,
    vocabulary: 0,
    status: "coming_soon",
    href: null,
  },
];
