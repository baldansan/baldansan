# Pilot Plan Template

Phase 7 Step 13 — exportable pilot plan for B2B organizations.

## Generator

`lib/organization/pilot-plan-builder.ts`

Exports:

- **Markdown** — shareable pilot plan document
- **JSON** — structured data for admin/CRM
- **Checklist** — task list with completion status

## Fields

| Field | Source |
|-------|--------|
| Organization name | `organizations.name` |
| Pilot stage | `organization_onboarding.pilot_stage` |
| Target start date | `organization_onboarding.target_start_date` |
| Target student count | `organization_onboarding.target_student_count` |
| Pilot goal | `organization_onboarding.pilot_goal` |
| Tasks | `organization_onboarding_tasks` |
| Readiness score | Calculated via `calculatePilotReadiness()` |

## Usage

From the setup wizard or pilot dashboard, export the plan for school admins or sales follow-up.

## Example checklist

- [ ] Organization profile confirmed
- [ ] At least one teacher invited
- [ ] Pilot classroom created
- [ ] First assignment published
- [ ] Pilot report reviewed
