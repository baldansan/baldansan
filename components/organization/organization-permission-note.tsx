import type { OrganizationMemberRole } from "@/lib/b2b/types";
import {
  canCreateAssignments,
  canManageClassrooms,
  canManageOrganization,
  canViewReports,
} from "@/lib/supabase/organization-permissions";

type Props = {
  role: OrganizationMemberRole;
};

export function OrganizationPermissionNote({ role }: Props) {
  const items: string[] = [];
  if (canManageOrganization({ role })) items.push("Manage members");
  if (canManageClassrooms({ role })) items.push("Create classrooms");
  if (canCreateAssignments({ role })) items.push("Create assignments");
  if (canViewReports({ role })) items.push("View reports");
  if (items.length === 0) items.push("View organization content");

  return (
    <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-200">
      Your permissions: {items.join(" · ")}
    </p>
  );
}
