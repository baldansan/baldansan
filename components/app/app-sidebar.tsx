"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_NAV_ITEMS, type AppNavTab } from "@/lib/app-navigation";
import { getCurrentUser, hasSupabaseConfig, signOut } from "@/lib/supabase/auth";

type Props = {
  active: AppNavTab;
};

export function AppSidebar({ active }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      if (!hasSupabaseConfig) return;
      const { data } = await getCurrentUser();
      setEmail(data?.email ?? null);
    }
    void loadUser();
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="bs-app-sidebar" aria-label="Үндсэн цэс">
      <div className="bs-app-sidebar-brand">
        <span className="bs-app-sidebar-logo" aria-hidden>
          学
        </span>
        <div className="min-w-0">
          <p className="bs-app-sidebar-title">Бөөндөө Сурцгаая</p>
          <p className="bs-app-sidebar-sub">Хятад хэл сурах</p>
        </div>
      </div>

      <nav className="bs-app-sidebar-nav" aria-label="App navigation">
        {APP_NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`bs-app-sidebar-link${
              active === item.key ? " bs-app-sidebar-link--on" : ""
            }`}
            aria-current={active === item.key ? "page" : undefined}
          >
            <span className="bs-app-sidebar-link-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="bs-app-sidebar-footer">
        {email ? (
          <p className="bs-app-sidebar-email" title={email}>
            {email}
          </p>
        ) : (
          <Link href="/login" className="bs-app-sidebar-login">
            Нэвтрэх
          </Link>
        )}
        {email ? (
          <button
            type="button"
            className="bs-app-sidebar-logout"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
          >
            {signingOut ? "Гарч байна…" : "Гарах"}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
