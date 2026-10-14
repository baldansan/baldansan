import { FazhanCoursePage, fazhanCourseMetadata } from "@/components/courses/fazhan-course-page";

export const dynamic = "force-dynamic";
export const metadata = fazhanCourseMetadata("fazhan-chuji2");

export default function Page() {
  return <FazhanCoursePage courseId="fazhan-chuji2" />;
}
