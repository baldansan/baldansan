import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

/**
 * Rendered inside `AdminLayoutShell`'s `<main>`, so it must NOT repeat the
 * layout chrome — doing so painted a second sidebar over the content area.
 */
export default function AdminLoading() {
  return <PageLoadingSkeleton rows={4} />;
}
