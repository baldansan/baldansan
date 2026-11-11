"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

/** True when a page renders inside the teacher/admin workspace (sidebar) shell. */
export const WorkspaceContext = createContext(false);

export function useInWorkspace(): boolean {
  return useContext(WorkspaceContext);
}

/* ------------------------------------------------------------------ */
/* Админ эсэх — нэг удаа асуугаад бүх хэрэглэгчид хуваалцана           */
/* ------------------------------------------------------------------ */

type AdminState = "unknown" | "admin" | "teacher";

let adminState: AdminState = "unknown";
let started = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function ensureStarted() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const cached = window.localStorage.getItem("bs.workspace.role");
    if (cached === "admin" || cached === "teacher") adminState = cached;
  } catch {
    /* storage unavailable */
  }
  fetch("/api/admin/me", { credentials: "same-origin", cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { isAdmin: false }))
    .then((j: { isAdmin?: boolean }) => {
      adminState = j.isAdmin === true ? "admin" : "teacher";
      try {
        window.localStorage.setItem("bs.workspace.role", adminState);
      } catch {
        /* ignore */
      }
      emit();
    })
    .catch(() => {
      if (adminState === "unknown") {
        adminState = "teacher";
        emit();
      }
    });
}

function subscribe(cb: () => void) {
  ensureStarted();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** "unknown" until the server answers; never guesses admin. */
export function useWorkspaceRole(): AdminState {
  return useSyncExternalStore(
    subscribe,
    () => adminState,
    () => "unknown" as AdminState
  );
}
