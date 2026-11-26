"use client";

import { InstallAppGuide } from "@/components/intro/install-app-guide";

/**
 * Хуучин «App суулгах» карт. Одоо нүүрний зурагтай 3 алхамт заавартай нэг болсон —
 * суулгасан хүнд гарахгүй, iPhone/Android-ийг таньдаг.
 */
export function PwaInstallCard({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <InstallAppGuide />
    </div>
  );
}
