export type CourseStatus = "available" | "coming_soon";

export type Course = {
  id: string;
  title: string;
  level: string;
  description: string;
  lessons: number;
  vocabulary: number;
  status: CourseStatus;
  href: string | null;
  coverUrl?: string | null;
};
