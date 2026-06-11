"use client";

import { useState } from "react";
import { MockTestListClient } from "@/components/mock-test/mock-test-list-client";
import { HanziMemorizeClient } from "@/components/review/hanzi-memorize-client";
import { ReviewSrsClient } from "@/components/review/review-srs-client";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import type { MockTestRow } from "@/lib/mock-test/types";

type ReviewTab = "daily" | "memorize" | "mocktest";

type Props = {
  tests?: MockTestRow[];
};

export function ReviewHubClient({ tests = [] }: Props) {
  const [tab, setTab] = useState<ReviewTab>("daily");

  return (
    <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full px-4 pb-8">
      <nav className="bs-review-tabs bs-review-tabs--3" aria-label="Давтах хэсгүүд">
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
        <button
          type="button"
          className={`bs-review-tab ${tab === "mocktest" ? "bs-review-tab--active" : ""}`}
          onClick={() => setTab("mocktest")}
        >
          HSK тест
        </button>
      </nav>

      {tab === "daily" ? (
        <ReviewSrsClient embedded />
      ) : tab === "memorize" ? (
        <HanziMemorizeClient />
      ) : (
        <MockTestListClient tests={tests} embedded />
      )}
    </MobileAppShell>
  );
}
