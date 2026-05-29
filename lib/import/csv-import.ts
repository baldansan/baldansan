export type CsvImportType = "organization_members" | "classroom_students";

export type OrganizationMemberImportRow = {
  rowIndex: number;
  email: string | null;
  displayName: string | null;
  role: string;
  status: string;
  userId: string | null;
};

export type ClassroomStudentImportRow = {
  rowIndex: number;
  email: string | null;
  displayName: string | null;
  studentUserId: string | null;
  status: string;
};

export type CsvValidationResult<T> = {
  validRows: T[];
  warnings: string[];
  errors: string[];
  duplicates: string[];
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
    warningCount: number;
    duplicateCount: number;
  };
};

export type BulkImportRowResult = {
  rowIndex: number;
  status: "inserted" | "skipped" | "error";
  message?: string;
  email?: string | null;
  displayName?: string | null;
  id?: string;
};

export type BulkImportResult = {
  importedAt: string;
  type: CsvImportType;
  inserted: number;
  skipped: number;
  errors: string[];
  warnings: string[];
  duplicates: string[];
  rows: BulkImportRowResult[];
};

const ORG_MEMBER_ROLES = new Set([
  "owner",
  "manager",
  "teacher",
  "assistant",
  "student",
]);

const MEMBER_HEADER_ALIASES: Record<string, string> = {
  email: "email",
  display_name: "display_name",
  name: "display_name",
  full_name: "display_name",
  role: "role",
  status: "status",
  user_id: "user_id",
};

const STUDENT_HEADER_ALIASES: Record<string, string> = {
  email: "email",
  display_name: "display_name",
  name: "display_name",
  full_name: "display_name",
  student_user_id: "student_user_id",
  user_id: "student_user_id",
  status: "status",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function parseCsvText(rawText: string): string[][] {
  const lines = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  return lines.map((line) => parseCsvLine(line, delimiter));
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function normalizeCsvHeaders(
  headers: string[],
  type: CsvImportType
): string[] {
  const aliases =
    type === "organization_members" ? MEMBER_HEADER_ALIASES : STUDENT_HEADER_ALIASES;
  return headers.map((h) => {
    const key = h.trim().toLowerCase().replace(/\s+/g, "_");
    return aliases[key] ?? key;
  });
}

export function detectDuplicateEmails(
  rows: Array<{ email: string | null; rowIndex: number }>
): string[] {
  const seen = new Map<string, number>();
  const duplicates: string[] = [];

  for (const row of rows) {
    if (!row.email) continue;
    const key = row.email.toLowerCase();
    const prev = seen.get(key);
    if (prev != null) {
      duplicates.push(
        `Duplicate email "${row.email}" at rows ${prev} and ${row.rowIndex}.`
      );
    } else {
      seen.set(key, row.rowIndex);
    }
  }
  return duplicates;
}

function isEmptyRow(values: string[]): boolean {
  return values.every((v) => !v.trim());
}

function normalizeEmail(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function normalizeOptional(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function validateOrganizationMemberRows(
  rawText: string
): CsvValidationResult<OrganizationMemberImportRow> {
  const matrix = parseCsvText(rawText);
  const warnings: string[] = [];
  const errors: string[] = [];
  const validRows: OrganizationMemberImportRow[] = [];

  if (matrix.length === 0) {
    return {
      validRows: [],
      warnings: [],
      errors: ["CSV is empty."],
      duplicates: [],
      summary: {
        totalRows: 0,
        validCount: 0,
        errorCount: 1,
        warningCount: 0,
        duplicateCount: 0,
      },
    };
  }

  const headers = normalizeCsvHeaders(matrix[0], "organization_members");
  const hasHeader = headers.includes("email") || headers.includes("display_name");
  const dataRows = hasHeader ? matrix.slice(1) : matrix;
  const startIndex = hasHeader ? 2 : 1;

  if (!hasHeader) {
    warnings.push("No header row detected — using column order: email, display_name, role, status.");
  }

  for (let i = 0; i < dataRows.length; i += 1) {
    const rowIndex = startIndex + i;
    const cells = dataRows[i];
    if (isEmptyRow(cells)) continue;

    const record: Record<string, string> = {};
    if (hasHeader) {
      headers.forEach((h, idx) => {
        record[h] = cells[idx] ?? "";
      });
    } else {
      record.email = cells[0] ?? "";
      record.display_name = cells[1] ?? "";
      record.role = cells[2] ?? "";
      record.status = cells[3] ?? "";
      record.user_id = cells[4] ?? "";
    }

    const email = normalizeEmail(record.email);
    const displayName = normalizeOptional(record.display_name);
    const userId = normalizeOptional(record.user_id);

    if (!email && !displayName) {
      errors.push(`Row ${rowIndex}: email or display_name is required.`);
      continue;
    }

    if (email && !EMAIL_RE.test(email)) {
      errors.push(`Row ${rowIndex}: invalid email "${email}".`);
      continue;
    }

    if (!email && displayName) {
      warnings.push(`Row ${rowIndex}: offline/demo row without email (${displayName}).`);
    }

    let role = (record.role?.trim().toLowerCase() || "teacher") as string;
    if (!ORG_MEMBER_ROLES.has(role)) {
      warnings.push(`Row ${rowIndex}: invalid role "${role}" — defaulting to teacher.`);
      role = "teacher";
    }

    const status = record.status?.trim().toLowerCase() || "invited";

    validRows.push({
      rowIndex,
      email,
      displayName,
      role,
      status,
      userId,
    });
  }

  const duplicates = detectDuplicateEmails(validRows);

  return {
    validRows,
    warnings: [...warnings, ...duplicates.map((d) => `Warning: ${d}`)],
    errors,
    duplicates,
    summary: {
      totalRows: dataRows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      warningCount: warnings.length + duplicates.length,
      duplicateCount: duplicates.length,
    },
  };
}

export function validateClassroomStudentRows(
  rawText: string
): CsvValidationResult<ClassroomStudentImportRow> {
  const matrix = parseCsvText(rawText);
  const warnings: string[] = [];
  const errors: string[] = [];
  const validRows: ClassroomStudentImportRow[] = [];

  if (matrix.length === 0) {
    return {
      validRows: [],
      warnings: [],
      errors: ["CSV is empty."],
      duplicates: [],
      summary: {
        totalRows: 0,
        validCount: 0,
        errorCount: 1,
        warningCount: 0,
        duplicateCount: 0,
      },
    };
  }

  const headers = normalizeCsvHeaders(matrix[0], "classroom_students");
  const hasHeader = headers.includes("email") || headers.includes("display_name");
  const dataRows = hasHeader ? matrix.slice(1) : matrix;
  const startIndex = hasHeader ? 2 : 1;

  if (!hasHeader) {
    warnings.push("No header row detected — using column order: email, display_name, status.");
  }

  for (let i = 0; i < dataRows.length; i += 1) {
    const rowIndex = startIndex + i;
    const cells = dataRows[i];
    if (isEmptyRow(cells)) continue;

    const record: Record<string, string> = {};
    if (hasHeader) {
      headers.forEach((h, idx) => {
        record[h] = cells[idx] ?? "";
      });
    } else {
      record.email = cells[0] ?? "";
      record.display_name = cells[1] ?? "";
      record.status = cells[2] ?? "";
      record.student_user_id = cells[3] ?? "";
    }

    const email = normalizeEmail(record.email);
    const displayName = normalizeOptional(record.display_name);
    const studentUserId = normalizeOptional(record.student_user_id);

    if (!email && !displayName) {
      errors.push(`Row ${rowIndex}: email or display_name is required.`);
      continue;
    }

    if (email && !EMAIL_RE.test(email)) {
      errors.push(`Row ${rowIndex}: invalid email "${email}".`);
      continue;
    }

    if (!email && displayName) {
      warnings.push(`Row ${rowIndex}: offline/demo student without email (${displayName}).`);
    }

    const status = record.status?.trim().toLowerCase() || "invited";

    validRows.push({
      rowIndex,
      email,
      displayName,
      studentUserId,
      status,
    });
  }

  const duplicates = detectDuplicateEmails(validRows);

  return {
    validRows,
    warnings: [...warnings, ...duplicates.map((d) => `Warning: ${d}`)],
    errors,
    duplicates,
    summary: {
      totalRows: dataRows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      warningCount: warnings.length + duplicates.length,
      duplicateCount: duplicates.length,
    },
  };
}

export function buildImportPreview(
  rows: OrganizationMemberImportRow[] | ClassroomStudentImportRow[],
  type: CsvImportType
): { headers: string[]; cells: string[][] } {
  if (type === "organization_members") {
    const memberRows = rows as OrganizationMemberImportRow[];
    return {
      headers: ["#", "email", "display_name", "role", "status"],
      cells: memberRows.map((r) => [
        String(r.rowIndex),
        r.email ?? "",
        r.displayName ?? "",
        r.role,
        r.status,
      ]),
    };
  }
  const studentRows = rows as ClassroomStudentImportRow[];
  return {
    headers: ["#", "email", "display_name", "student_user_id", "status"],
    cells: studentRows.map((r) => [
      String(r.rowIndex),
      r.email ?? "",
      r.displayName ?? "",
      r.studentUserId ?? "",
      r.status,
    ]),
  };
}

export function buildImportReport(result: BulkImportResult): {
  summary: string;
  markdown: string;
  json: string;
} {
  const summary = [
    `Imported: ${result.inserted}`,
    `Skipped: ${result.skipped}`,
    `Errors: ${result.errors.length}`,
  ].join(" · ");

  const lines = [
    `# CSV import report`,
    ``,
    `- Type: ${result.type}`,
    `- Imported at: ${result.importedAt}`,
    `- Inserted: ${result.inserted}`,
    `- Skipped: ${result.skipped}`,
    `- Errors: ${result.errors.length}`,
    `- Warnings: ${result.warnings.length}`,
    `- Duplicates: ${result.duplicates.length}`,
    ``,
  ];

  if (result.warnings.length > 0) {
    lines.push(`## Warnings`, ...result.warnings.map((w) => `- ${w}`), ``);
  }
  if (result.errors.length > 0) {
    lines.push(`## Errors`, ...result.errors.map((e) => `- ${e}`), ``);
  }
  if (result.duplicates.length > 0) {
    lines.push(`## Duplicates`, ...result.duplicates.map((d) => `- ${d}`), ``);
  }
  if (result.rows.length > 0) {
    lines.push(`## Rows`, `| Row | Status | Detail |`, `| --- | --- | --- |`);
    for (const row of result.rows) {
      lines.push(
        `| ${row.rowIndex} | ${row.status} | ${row.message ?? row.email ?? row.displayName ?? "—"} |`
      );
    }
  }

  return {
    summary,
    markdown: lines.join("\n"),
    json: JSON.stringify(result, null, 2),
  };
}

export const ORG_MEMBER_EXAMPLE_CSV = `email,display_name,role,status
teacher1@example.com,Teacher One,teacher,invited
manager@example.com,Manager One,manager,invited`;

export const CLASSROOM_STUDENT_EXAMPLE_CSV = `email,display_name,status
student1@example.com,Student One,invited
student2@example.com,Student Two,invited`;
