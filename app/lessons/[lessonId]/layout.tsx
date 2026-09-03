import { OfflineLessonPrefetch } from "@/components/lesson/offline-lesson-prefetch";

export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <OfflineLessonPrefetch />
    </>
  );
}
