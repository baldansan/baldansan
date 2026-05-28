import type { Course } from "@/types/course";

export const courses: Course[] = [
  {
    id: "hsk4",
    title: "HSK4 Short Drama Chinese",
    level: "HSK4",
    description:
      "Богино бичлэгээр HSK4 түвшний үг, өгүүлбэр, яриаг сурна.",
    lessons: 12,
    vocabulary: 240,
    status: "available",
    href: "/courses/hsk5",
  },
  {
    id: "hsk5",
    title: "HSK5 Short Drama Chinese",
    level: "HSK5",
    description:
      "Илүү гүнзгий хэллэг, subtitle, shadowing, quiz-тэй хичээлүүд.",
    lessons: 20,
    vocabulary: 500,
    status: "available",
    href: "/courses/hsk5",
  },
  {
    id: "taobao",
    title: "Taobao Chinese",
    level: "Practical",
    description:
      "Таобао, 拼多多, 得物 дээр хэрэглэгдэх бодит хятад үг, өгүүлбэрүүд.",
    lessons: 15,
    vocabulary: 300,
    status: "coming_soon",
    href: null,
  },
];
