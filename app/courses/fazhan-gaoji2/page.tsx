import { FazhanCoursePage, fazhanCourseMetadata } from "@/components/courses/fazhan-course-page";

export const dynamic = "force-dynamic";
export const metadata = fazhanCourseMetadata("fazhan-gaoji2");

export default function Page() {
  return <FazhanCoursePage courseId="fazhan-gaoji2" />;
}
