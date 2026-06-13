import type { HelzuiRoleColorDef, HelzuiRoleColors } from "@/types/helzui-course";

export function resolveRoleColors(
  courseColors: HelzuiRoleColors
): Record<string, HelzuiRoleColorDef> {
  return courseColors;
}

export function roleColor(
  colors: HelzuiRoleColors,
  role: string
): HelzuiRoleColorDef {
  return (
    colors[role] ?? {
      label: role,
      color: "#7a8a82",
    }
  );
}

export const LEGEND_ROLES = [
  "subj",
  "pred",
  "obj",
  "attr",
  "adv",
  "aux",
] as const;
