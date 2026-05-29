import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";
import { PublicPageShell } from "@/components/public-page-shell";

export default function RootLoading() {
  return (
    <PublicPageShell active="home">
      <PageLoadingSkeleton rows={4} />
    </PublicPageShell>
  );
}
