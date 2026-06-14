"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { MobileCard } from "@/components/mobile/mobile-card";
import { TemeeEmojiIcon } from "@/components/temee/temee-emoji-icon";
import {
  filterGrammarSearchEntries,
  type GrammarSearchEntry,
} from "@/lib/grammar/grammar-search";

type Props = {
  entries: GrammarSearchEntry[];
  placeholder?: string;
  children: ReactNode;
};

const DEFAULT_PLACEHOLDER =
  "Дүрэм хайх... (ж: 把, өнгөрсөн цаг, 了)";

export function GrammarCourseSearch({
  entries,
  placeholder = DEFAULT_PLACEHOLDER,
  children,
}: Props) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  const results = useMemo(
    () => filterGrammarSearchEntries(entries, trimmed),
    [entries, trimmed]
  );

  const isSearching = trimmed.length > 0;

  return (
    <>
      <label className="hz-grammar-search" aria-label="Дүрэм хайх">
        <span className="hz-grammar-search-icon" aria-hidden>🔍</span>
        <input
          type="search"
          className="hz-grammar-search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          enterKeyHint="search"
        />
        {query ? (
          <button
            type="button"
            className="hz-grammar-search-clear"
            onClick={() => setQuery("")}
            aria-label="Хайлт цэвэрлэх"
          >
            ✕
          </button>
        ) : null}
      </label>

      {isSearching ? (
        <div className="hz-grammar-search-results">
          {results.length > 0 ? (
            <div className="flex flex-col gap-2">
              {results.map((entry) => (
                <Link key={entry.id} href={entry.href}>
                  <MobileCard className="hz-grammar-search-card active:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="zh text-lg font-bold text-[#13241b]">
                          {entry.zh}
                        </p>
                        <p className="text-xs font-semibold text-[#1FB85A]">
                          {entry.pin}
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--app-muted)] line-clamp-2">
                          {entry.gloss}
                        </p>
                      </div>
                      <span className="hz-grammar-search-badge shrink-0">
                        {entry.levelBadge}
                      </span>
                    </div>
                  </MobileCard>
                </Link>
              ))}
            </div>
          ) : (
            <div className="hz-grammar-search-empty">
              <TemeeEmojiIcon
                variant="think"
                width={72}
                height={72}
                className="hz-grammar-search-empty-img"
              />
              <p className="hz-grammar-search-empty-title">
                Тохирох дүрэм олдсонгүй
              </p>
              <p className="hz-grammar-search-empty-sub">
                Өөр түлхүүр үг, хятад бичиг эсвэл монгол нэрээр дахин хайна уу.
              </p>
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </>
  );
}
