"use client";

import { useState } from "react";
import { HanziMemorizeClient } from "@/components/review/hanzi-memorize-client";
import { ReviewSrsClient } from "@/components/review/review-srs-client";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";

type ReviewTab = "daily" | "memorize";

export function ReviewHubClient() {
  const [tab, setTab] = useState<ReviewTab>("daily");

  return (
    <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full px-4 pb-8">
      <nav className="bs-review-tabs" aria-label="Давтах хэсгүүд">
        <button
          type="button"
          className={`bs-review-tab ${tab === "daily" ? "bs-review-tab--active" : ""}`}
          onClick={() => setTab("daily")}
        >
          Давталт
        </button>
        <button
          type="button"
          className={`bs-review-tab ${tab === "memorize" ? "bs-review-tab--active" : ""}`}
          onClick={() => setTab("memorize")}
        >
          Цээжлэх
        </button>
      </nav>

      {tab === "daily" ? (
        <ReviewSrsClient embedded />
      ) : (
        <HanziMemorizeClient />
      )}
    </MobileAppShell>
  );
}
