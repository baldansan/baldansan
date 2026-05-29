# CSV Import Guide

Phase 7 Step 14 — bulk CSV paste/import for organization members and classroom students.

## Overview

Schools and training centers can paste CSV or spreadsheet rows to onboard many teachers and students quickly. **No real email is sent** in this step — rows are stored with `invited` status until linked to auth users later.

## CSV paste format

- Comma-separated values (CSV)
- Tab-separated spreadsheet paste is also supported
- Optional header row (recommended)
- Empty rows are ignored
- Quoted fields supported (`"Name, Jr"`)

## Organization member import

**Route:** `/organization/{organizationId}/members/import`

**Headers:**

| Header | Aliases | Required |
|--------|---------|----------|
| email | — | Yes*, unless display_name for offline/demo |
| display_name | name, full_name | Yes*, unless email |
| role | — | No (default: teacher) |
| status | — | No (default: invited) |
| user_id | — | No |

**Roles:** owner, manager, teacher, assistant, student

**Example:**

```csv
email,display_name,role,status
teacher1@example.com,Teacher One,teacher,invited
manager@example.com,Manager One,manager,invited
```

## Classroom student import

**Route:** `/teacher/classes/{classroomId}/students/import`

**Headers:**

| Header | Aliases | Required |
|--------|---------|----------|
| email | — | Yes*, unless display_name for offline/demo |
| display_name | name, full_name | Yes*, unless email |
| student_user_id | user_id | No |
| status | — | No (default: invited) |

**Example:**

```csv
email,display_name,status
student1@example.com,Student One,invited
student2@example.com,Student Two,invited
```

## Validation

- Invalid email → error (row skipped from import)
- Duplicate email in CSV → warning
- Duplicate email in org/classroom → skipped on import
- Invalid role → warning, defaults to teacher (org members)

## Import report

After import, copy or download Markdown/JSON report with:

- importedAt, type, inserted/skipped counts
- errors, warnings, duplicate rows
- per-row status

## No real email yet

Rows are inserted directly into `organization_members` or `classroom_students`. Email invitation delivery is planned for Phase 7 Step 15+.

## Access

- Organization members: owner, manager, admin (RLS)
- Classroom students: classroom teacher, org manager, admin (RLS)

See [BULK_INVITE_WORKFLOW.md](./BULK_INVITE_WORKFLOW.md) for workflow details.
