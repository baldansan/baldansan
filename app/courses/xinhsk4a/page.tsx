import { FazhanCoursePage, fazhanCourseMetadata } from "@/components/courses/fazhan-course-page";

export const dynamic = "force-dynamic";
export const metadata = fazhanCourseMetadata("xinhsk4a");

export default function Page() {
  return <FazhanCoursePage courseId="xinhsk4a" />;
}
