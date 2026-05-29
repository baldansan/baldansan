"use client";

import { getPromptLibraryEntries } from "@/lib/admin/improvement-prompts";
import { ImprovementPromptCard } from "@/components/admin/improvement-prompt-card";

export function PromptLibraryView() {
  const entries = getPromptLibraryEntries();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Prompt library
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Хичээл үүсгэх, засах, сайжруулахад ашиглах copy-ready prompt-ууд.
          ChatGPT эсвэл Cursor руу paste хийнэ — апп AI API дуудахгүй.
        </p>
      </section>

      <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <p className="font-semibold">Workflow</p>
        <p className="mt-1">
          Analytics issue → Copy prompt → ChatGPT JSON → Bulk import → QA →
          Preview → Backup → Publish
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <ImprovementPromptCard
            key={entry.id}
            title={entry.title}
            subtitle={entry.description}
            prompt={entry.prompt}
            issueType={entry.issueType}
            defaultCollapsed={entry.id !== "full-lesson"}
          />
        ))}
      </div>
    </div>
  );
}
