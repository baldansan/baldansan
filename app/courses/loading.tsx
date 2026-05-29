import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";
import { PublicPageShell } from "@/components/public-page-shell";

export default function CoursesLoading() {
  return (
    <PublicPageShell active="courses">
      <PageLoadingSkeleton rows={3} />
    </PublicPageShell>
  );
}
