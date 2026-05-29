import type { OrganizationMemberRole } from "@/lib/b2b/types";
import { getOrganizationRoleLabel } from "@/lib/supabase/organization-permissions";

type Props = {
  role: OrganizationMemberRole;
};

export function OrganizationRoleBadge({ role }: Props) {
  const colors: Record<OrganizationMemberRole, string> = {
    owner: "bg-emerald-100 text-emerald-800",
    manager: "bg-blue-100 text-blue-800",
    teacher: "bg-slate-100 text-slate-800",
    assistant: "bg-amber-100 text-amber-800",
    student: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[role]}`}
    >
      {getOrganizationRoleLabel(role)}
    </span>
  );
}
