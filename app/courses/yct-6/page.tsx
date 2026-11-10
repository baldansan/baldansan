import { FazhanCoursePage, fazhanCourseMetadata } from "@/components/courses/fazhan-course-page";

export const dynamic = "force-dynamic";
export const metadata = fazhanCourseMetadata("yct-6");

export default function Page() {
  return <FazhanCoursePage courseId="yct-6" />;
}
