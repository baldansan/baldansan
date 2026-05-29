import type { BulkInviteRow, OrganizationMemberRole } from "@/lib/b2b/types";

const VALID_ROLES = new Set<OrganizationMemberRole>([
  "owner",
  "manager",
  "teacher",
  "assistant",
  "student",
]);

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

export function parseBulkInviteCsv(text: string): {
  rows: BulkInviteRow[];
  errors: string[];
} {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: ["CSV is empty."] };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const emailIdx = header.findIndex((h) => h === "email" || h === "e-mail");
  const nameIdx = header.findIndex(
    (h) => h === "display_name" || h === "name" || h === "display name"
  );
  const roleIdx = header.findIndex((h) => h === "role");

  const dataLines = emailIdx >= 0 ? lines.slice(1) : lines;
  const resolvedEmailIdx = emailIdx >= 0 ? emailIdx : 0;
  const resolvedNameIdx = nameIdx >= 0 ? nameIdx : 1;
  const resolvedRoleIdx = roleIdx >= 0 ? roleIdx : 2;

  const rows: BulkInviteRow[] = [];

  for (let i = 0; i < dataLines.length; i += 1) {
    const cols = parseCsvLine(dataLines[i]);
    const email = cols[resolvedEmailIdx]?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      errors.push(`Row ${i + 1}: invalid email.`);
      continue;
    }
    const displayName = cols[resolvedNameIdx]?.trim() || undefined;
    const roleRaw = (cols[resolvedRoleIdx]?.trim().toLowerCase() ??
      "teacher") as OrganizationMemberRole;
    const role = VALID_ROLES.has(roleRaw) ? roleRaw : "teacher";
    if (cols[resolvedRoleIdx] && !VALID_ROLES.has(roleRaw)) {
      errors.push(`Row ${i + 1}: invalid role, defaulting to teacher.`);
    }
    rows.push({ email, displayName, role });
  }

  return { rows, errors };
}

export function bulkInviteCsvTemplate(): string {
  return "email,display_name,role\nteacher@example.com,Багш A,teacher\nstudent@example.com,Сурагч B,student";
}
