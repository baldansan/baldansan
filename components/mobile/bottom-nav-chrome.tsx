"use client";

import BottomNav, { type BottomNavTab } from "@/components/BottomNav";

type Props = {
  active: BottomNavTab;
};

/** Bottom tab bar. HSK level picker lives in the top header only. */
export function BottomNavChrome({ active }: Props) {
  return (
    <div className="bs-bottomnav-shell">
      <BottomNav active={active} embedded />
    </div>
  );
}
