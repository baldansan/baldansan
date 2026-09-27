import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

/**
 * Апп доторх аль ч route (Нүүр/Давтах/Бичлэг/Тоглоом/Профайл гэх мэт) хооронд
 * шилжихэд, тухайн хуудсын өөрийн loading.tsx байхгүй бол ЭНЭ харагдана.
 * Иймд одоогийн MobileAppShell-тэй ижил bottom nav ашиглана — хуучин
 * PublicPageShell (Хичээлүүд/Миний самбар гэсэн хуучин цэс) биш, эс тэгвэл
 * шилжилтийн богино агшинд хуучирсан цэс анивчиж харагддаг байсан.
 */
export default function RootLoading() {
  return (
    <MobileAppShell>
      <PageLoadingSkeleton rows={4} />
    </MobileAppShell>
  );
}
