import { fazhanCourseMetadata } from "@/components/courses/fazhan-course-page";
import { YctCoursePage } from "@/components/kids/yct-course-page";

export const dynamic = "force-dynamic";
export const metadata = fazhanCourseMetadata("yct-2");

export default function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  return <YctCoursePage courseId="yct-2" searchParams={searchParams} />;
}
