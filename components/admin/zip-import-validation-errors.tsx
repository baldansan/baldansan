"use client";

import {
  collectValidationErrorMessages,
  formatValidationError,
} from "@/lib/import/format-validation-error";
import type { LessonZipValidation } from "@/lib/import/lesson-zip-import";

type Props = {
  validation: LessonZipValidation;
};

export function ZipImportValidationErrors({ validation }: Props) {
  const messages = collectValidationErrorMessages(validation);
  if (messages.length === 0) return null;

  const formatted = messages.map(formatValidationError);

  return (
    <section
      className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200 sm:p-6"
      aria-labelledby="zip-validation-errors-heading"
    >
      <h2
        id="zip-validation-errors-heading"
        className="text-base font-semibold text-red-900"
      >
        Validation алдаа ({formatted.length})
      </h2>
      <p className="mt-1 text-sm text-red-800">
        Дараах алдааг зассаны дараа дахин Parse / Validate дарна уу.
      </p>
      <ol className="mt-4 space-y-3">
        {formatted.map((item, index) => (
          <li
            key={`${item.raw}-${index}`}
            className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-red-100"
          >
            <p className="font-mono text-xs font-semibold text-red-900">{item.path}</p>
            <p className="mt-1 text-sm text-red-900">{item.issue}</p>
            {item.expected || item.found ? (
              <dl className="mt-2 grid gap-1 text-xs text-red-800 sm:grid-cols-2">
                {item.expected ? (
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-red-700">
                      Expected
                    </dt>
                    <dd className="mt-0.5">{item.expected}</dd>
                  </div>
                ) : null}
                {item.found ? (
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-red-700">
                      Found
                    </dt>
                    <dd className="mt-0.5">{item.found}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
