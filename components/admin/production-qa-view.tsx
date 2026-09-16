"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PRODUCTION_URL,
  productionUrl,
  type QaCheckItem,
  type QaCheckSectionId,
} from "@/lib/admin/production-qa-data";
import {
  initProductionQaItems,
  loadProductionQaStorage,
  resetProductionQaStorage,
  saveAllProductionQaItems,
} from "@/lib/admin/production-qa-storage";
import { ProductionQaExportCard } from "@/components/admin/production-qa-export-card";
import { ProductionRouteChecklist } from "@/components/admin/production-route-checklist";
import {
  ProductionQaBlockers,
  ProductionQaSummary,
} from "@/components/admin/production-qa-summary";

const SECTION_ORDER: QaCheckSectionId[] = [
  "public",
  "v1",
  "admin",
  "auth",
  "supabase",
  "cms",
];

export function ProductionQaView() {
  const [items, setItems] = useState<QaCheckItem[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(initProductionQaItems());
    setSavedAt(loadProductionQaStorage().savedAt ?? null);
    setHydrated(true);
  }, []);

  const handleUpdate = useCallback(
    (id: string, patch: Partial<Pick<QaCheckItem, "status" | "notes">>) => {
      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...patch,
                updatedAt: new Date().toISOString(),
              }
            : item
        );
        return next;
      });
    },
    []
  );

  function handleSave() {
    const storage = saveAllProductionQaItems(items);
    setSavedAt(storage.savedAt ?? null);
  }

  function handleReset() {
    resetProductionQaStorage();
    const fresh = initProductionQaItems();
    setItems(fresh);
    setSavedAt(null);
  }

  if (!hydrated) {
    return (
      <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
        Чанарын шалгалт ачаалж байна…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Ажлын орчны хаяг</h2>
        <p className="mt-2 font-mono text-sm text-emerald-800">{PRODUCTION_URL}</p>
        <p className="mt-2 text-sm text-slate-600">
          Ажлын орчны хуудсыг шинэ цонхонд нээж гараар шалгаад доор төлөвийг
          нь тэмдэглэнэ үү. Автомат шалгалтууд:{" "}
          <a
            href={productionUrl("/deployment-check")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-800 hover:underline"
          >
            /deployment-check
          </a>
          ,{" "}
          <a
            href={productionUrl("/admin/system-check")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-800 hover:underline"
          >
            /admin/system-check
          </a>
          .
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={productionUrl("/")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Ажлын нүүр хуудсыг нээх
          </a>
          <a
            href={productionUrl("/deployment-check")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Байршуулалтын шалгалтыг нээх
          </a>
          <a
            href={productionUrl("/admin/system-check")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Ажлын орчны системийн шалгалтыг нээх
          </a>
          <Link
            href="/admin/security-audit"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Аюулгүй байдал / RLS үзлэг
          </Link>
          <Link
            href="/admin/launch-candidate"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Гаргалтын хувилбарын тайлан
          </Link>
          <Link
            href="/admin/launch-signoff"
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Гаргалтын баталгаа
          </Link>
        </div>
      </section>

      <ProductionQaSummary items={items} />

      {SECTION_ORDER.map((section) => (
        <ProductionRouteChecklist
          key={section}
          section={section}
          items={items}
          onUpdate={handleUpdate}
        />
      ))}

      <ProductionQaBlockers items={items} />

      <ProductionQaExportCard
        items={items}
        onSave={handleSave}
        onReset={handleReset}
        savedAt={savedAt}
      />
    </div>
  );
}
