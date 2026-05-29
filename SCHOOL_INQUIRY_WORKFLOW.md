# School Inquiry Workflow — Buunduu Surtsgaay

## Current behavior (Phase 7 Step 10)

Route: **`/school-inquiry`**

- **Backend submission implemented** — inserts into `b2b_inquiries` (Supabase + RLS)
- Works for anonymous and logged-in users
- Admin reviews at `/admin/b2b/inquiries`
- Copy-to-clipboard fallback still available on success and on error

Success message:

> Inquiry амжилттай илгээгдлээ.

## Fields collected

| Field | Purpose |
|-------|---------|
| Organization name | School or training center name |
| Contact person | Primary contact |
| Email / phone | Reply channels |
| Organization type | training_center / school / university / teacher / company / other |
| Number of students | Scale estimate |
| Interested package | teacher / school / training_center / custom |
| Message | Free text — demo request, questions, pilot interest |

## Privacy note

- Inquiry content is stored in Supabase `b2b_inquiries` (admin-only read via RLS)
- Public users cannot read other inquiries
- Do not paste secrets into the message field

## Admin workflow

1. New inquiry appears in `/admin/b2b` with status `new`
2. Admin opens detail → updates status, adds notes, logs activity
3. Optional: **Create organization from inquiry**
4. Manage organization and members at `/admin/b2b/organizations`

See [B2B_CRM_WORKFLOW.md](./B2B_CRM_WORKFLOW.md).

## Migration required

Run `supabase/migrations/012_school_organizations_b2b_crm.sql` on your Supabase project.

## Implementation

- Form: `components/b2b/school-inquiry-form.tsx`
- API: `lib/supabase/b2b-inquiries.ts` → `createB2BInquiry()`

## Future improvements

- Auto-reply confirmation email
- Webhook to external CRM
- Teacher self-serve org linking after admin approval

## Related

- [B2B_SCHOOL_PACKAGE.md](./B2B_SCHOOL_PACKAGE.md)
- [ORGANIZATION_ACCOUNTS.md](./ORGANIZATION_ACCOUNTS.md)
- [TEACHER_ONBOARDING.md](./TEACHER_ONBOARDING.md)
