/** B2B / school-facing copy — Phase 7 Step 6. Mark planned features clearly. */

export const B2B_BRAND_NOTE =
  "Бөөндөө Сурцгаая — богино бичлэг дээр суурилсан Хятад хэлний digital lesson platform.";

export const PLANNED_BADGE = "Дараагийн шатанд";

export const SCHOOL_HERO = {
  label: "Сургалтын төв · Сургууль · B2B",
  title: "Богино бичлэгээр Хятад хэл заах шинэ хэлбэр",
  subtitle:
    "Бөөндөө Сурцгаая нь subtitle, pinyin, vocabulary, quiz, progress tracking ашиглан сургалтын төв, багш, сурагчдад зориулсан богино хэлбэрийн Хятад хэлний хичээлийн систем юм.",
};

export const SCHOOL_PROBLEMS = [
  "Сурагчид удаан textbook хичээлээс уйддаг",
  "Listening/speaking practice дутагддаг",
  "Багш нар subtitle, vocabulary, quiz бэлтгэхэд цаг их зарцуулдаг",
  "Сургалтын төвүүд digital supplement хэрэгтэй",
];

export const SCHOOL_SOLUTIONS = [
  {
    title: "Short video lesson",
    desc: "Богино drama/scene бичлэг — анхаарал татах, бодит хятад хэл.",
  },
  {
    title: "Subtitle + pinyin + Mongolian",
    desc: "Хятад subtitle, pinyin, монгол тайлбартай — listening + reading.",
  },
  {
    title: "Vocabulary extraction",
    desc: "Хичээл бүрт үгийн сан — learned тэмдэглэл, review.",
  },
  {
    title: "Quiz and review",
    desc: "Дасгал, quiz, давталтын хэсэг — мэдлэг бататгах.",
  },
  {
    title: "Account progress tracking",
    desc: "Сурагчийн ахиц — dashboard, profile, weekly report.",
  },
  {
    title: "Admin CMS for lesson content",
    desc: "Багш/admin хичээлийн агуулга засах, нийтлэх CMS.",
  },
];

export const SCHOOL_AUDIENCE = [
  "Хятад хэлний сургалтын төв",
  "Ерөнхий боловсролын сургууль",
  "Их дээд сургуулийн нэмэлт хөтөлбөр",
  "Online Chinese teacher",
  "Self-study community",
];

export const SCHOOL_WORKFLOW = [
  "Багш хичээл зааж өгнө",
  "Сурагч богино scene үзнэ",
  "Сурагч vocabulary судална",
  "Сурагч quiz дуусгана",
  "Багш progress/report шалгана",
  "Анги алдаагаа давтан хянана",
];

export const B2B_PACKAGES = [
  {
    key: "starter",
    name: "Starter school package",
    desc: "Жижиг сургалтын төв — HSK5 public lessons, guest + account progress.",
    status: "placeholder",
  },
  {
    key: "teacher",
    name: "Teacher package",
    desc: "Багш нарт — lesson flow, vocabulary, quiz, review, demo access.",
    status: "placeholder",
  },
  {
    key: "training",
    name: "Training center package",
    desc: "Сургалтын төв — олон сурагч, onboarding support, custom roadmap.",
    status: "placeholder",
  },
  {
    key: "custom",
    name: "Custom B2B package",
    desc: "HSK, school curriculum, Taobao Chinese, short drama — custom content.",
    status: "placeholder",
  },
];

export const TEACHER_HERO = {
  label: "Багш нарт",
  title:
    "Багш таны хичээлийг subtitle, vocabulary, quiz-тэй digital package болгоно",
  subtitle:
    "Богино бичлэг дээр суурилсан хичээл, үгийн сан, дасгал, quiz, давталтын системийг багшийн заах арга зүйтэй хослуулна.",
};

export const TEACHER_BENEFITS = [
  {
    title: "Ready-to-use lesson flow",
    desc: "Watch → vocabulary → quiz → review — бэлэн flow.",
  },
  {
    title: "Subtitle + pinyin + Mongolian",
    desc: "Listening болон reading-ийг нэг дор.",
  },
  {
    title: "Vocabulary list",
    desc: "Хичээл бүрт үгийн сан, learned тэмдэглэл.",
  },
  {
    title: "Quiz questions",
    desc: "Автомат quiz — оноо, давталт.",
  },
  {
    title: "Student progress tracking",
    desc: "Account ашигласан сурагчийн ахиц харагдана (одоогоор account-level).",
  },
  {
    title: "Review mode",
    desc: "/review — сурсан үгсийг давтах.",
  },
];

export const TEACHER_USE_CASES = [
  "Homework assignment",
  "Speaking practice",
  "Listening class",
  "Vocabulary review",
  "Quiz/test preparation",
  "Short drama-based discussion",
];

export const TEACHER_WORKFLOW = [
  "Course/lesson сонгох",
  "Сурагчдад зааж өгөх",
  "Watch / vocab / quiz дуусгах",
  "Үр дүн шалгах",
  "Анги discussion хийх",
];

export const TEACHER_DASHBOARD_PREVIEW = [
  { title: "Class list", desc: "Анги, бүлгийн жагсаалт", planned: true },
  { title: "Student progress", desc: "Сурагч бүрийн ахиц", planned: true },
  { title: "Quiz average", desc: "Quiz дундаж оноо", planned: true },
  { title: "Difficult vocabulary", desc: "Хэцүү үгсийн жагсаалт", planned: true },
  { title: "Assignment status", desc: "Даалгаврын статус", planned: true },
];

export const DEMO_STEPS = [
  {
    step: 1,
    title: "Watch",
    desc: "Богино scene бичлэг — subtitle, pinyin.",
    href: "/lessons/1/watch",
  },
  {
    step: 2,
    title: "Vocabulary",
    desc: "Үгийн сан — learned тэмдэглэл.",
    href: "/lessons/1/vocabulary",
  },
  {
    step: 3,
    title: "Quiz",
    desc: "Дасгал quiz — оноо хадгална.",
    href: "/lessons/1/quiz",
  },
  {
    step: 4,
    title: "Review",
    desc: "Сурсан үгсийг давтах.",
    href: "/review",
  },
  {
    step: 5,
    title: "Progress",
    desc: "Dashboard, profile, weekly report.",
    href: "/dashboard",
  },
];

export const PRICING_PLANS = [
  {
    name: "Free learner",
    price: "₮0",
    desc: "HSK5 public lessons, guest progress, quiz, review.",
    highlight: true,
    features: ["Public lessons", "Guest + account progress", "Quiz & review"],
  },
  {
    name: "Teacher starter",
    price: "Удахгүй",
    desc: "Багш — lesson package, demo, student progress (account-level).",
    highlight: false,
    features: ["Lesson flow access", "Demo lessons", "Teacher dashboard planned"],
  },
  {
    name: "School package",
    price: "Удахгүй",
    desc: "Сургууль — class onboarding, teacher support, progress overview planned.",
    highlight: false,
    features: ["School onboarding", "Teacher accounts", "Class management planned"],
  },
  {
    name: "Training center package",
    price: "Удахгүй",
    desc: "Сургалтын төв — олон сурагч, weekly report, engagement tools.",
    highlight: false,
    features: ["Multi-student", "Weekly reports", "Reminders & achievements"],
  },
  {
    name: "Custom content package",
    price: "Тохирлын",
    desc: "Custom lesson content — HSK, curriculum, Taobao Chinese, drama.",
    highlight: false,
    features: ["Custom lessons via CMS", "B2B licensing", "Content partnership"],
  },
];

export const ORG_TYPES = [
  { value: "training_center", label: "Сургалтын төв" },
  { value: "school", label: "Сургууль" },
  { value: "university", label: "Их сургууль" },
  { value: "teacher", label: "Багш (хувь хүн)" },
  { value: "company", label: "Компани" },
  { value: "other", label: "Бусад" },
] as const;

export const INQUIRY_PACKAGES = [
  { value: "teacher", label: "Teacher package" },
  { value: "school", label: "School package" },
  { value: "training_center", label: "Training center package" },
  { value: "custom", label: "Custom B2B package" },
] as const;

export const PAYMENT_INACTIVE_NOTE =
  "Төлбөрийн систем хараахан идэвхгүй. Энэ бол package танилцуулгын placeholder.";

export const INQUIRY_BACKEND_NOTE =
  "Inquiry is submitted to admin B2B CRM when Supabase migration 012 is applied.";

export const TEACHER_DASHBOARD_PLANNED_NOTE =
  "Teacher/class management дараагийн шатанд идэвхжинэ.";
