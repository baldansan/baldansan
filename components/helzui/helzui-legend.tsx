import { LEGEND_ROLES, roleColor } from "@/lib/helzui/role-colors";
import type { HelzuiRoleColors } from "@/types/helzui-course";

type Props = {
  roleColors: HelzuiRoleColors;
};

export function HelzuiLegend({ roleColors }: Props) {
  return (
    <div className="hz-legend">
      {LEGEND_ROLES.map((role) => {
        const def = roleColor(roleColors, role);
        return (
          <span key={role} className="hz-chip">
            <i style={{ background: def.color }} aria-hidden />
            {def.label}
          </span>
        );
      })}
    </div>
  );
}
