/** Shared Mongolian labels for public learner navigation and CTAs. */
export const LEARNER_NAV = {
  home: "Нүүр",
  courses: "Хичээлүүд",
  dashboard: "Миний самбар",
  review: "Давтах",
  profile: "Профайл",
  onboarding: "Заавар",
  help: "Тусламж",
  login: "Нэвтрэх",
  logout: "Гарах",
  signup: "Бүртгүүлэх",
} as const;

export const LEARNER_LESSON = {
  watch: "Хичээл үзэх",
  studyLesson: "Хичээл судлах",
  startLesson: "Хичээлээ эхлэх",
  vocabulary: "Үгийн сан",
  vocabularyStudy: "Үгийн сан судлах",
  vocabularyFlashcard: "Үгийн сангаа flashcard-аар давтах",
  quiz: "Quiz өгөх",
  backToCourse: "Курс руу буцах",
  backToLesson: "Хичээл рүү буцах",
  nextVocabulary: "Үгийн сан руу",
  nextQuiz: "Quiz руу",
  markLearned: "Сурсан гэж тэмдэглэх",
  addedToReview: "Давталтад нэмэгдсэн ✓",
  showingWords: (visible: number, total: number) =>
    `${visible} / ${total} үг харагдаж байна`,
  videoPlaceholder: "Видео хараахан ороогүй байна",
  noVideoNote:
    "Видео байхгүй ч үгийн сан болон quiz-ээр сурч болно.",
  optionalVideo: "Нэмэлт видео",
  optionalVideoHint: "Хүсвэл богино тайлбар видео үзэж болно",
  optionalVideoMissing: "Видео хараахан нэмэгдээгүй — номын хичээлээр үргэлжлүүлнэ.",
  watchVideo: "Видео үзэх",
} as const;

export const LEARNER_QUIZ = {
  restart: "Дахин өгөх",
  reviewVocab: "Үг давтах",
  watchLesson: "Хичээл үзэх",
  nextLesson: "Дараагийн хичээл",
  backToCourse: "Курс руу буцах",
  bestScore: "Хамгийн сайн оноо",
  question: (n: number, total: number) => `Асуулт ${n} / ${total}`,
  next: "Дараах",
  seeResults: "Үр дүн харах",
} as const;
