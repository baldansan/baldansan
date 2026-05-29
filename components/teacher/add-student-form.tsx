"use client";

import { useState } from "react";
import {
  addStudentToClassroom,
  removeStudentFromClassroom,
} from "@/lib/supabase/classrooms";

type Props = {
  classroomId: string;
  onAdded: () => void;
};

export function AddStudentForm({ classroomId, onAdded }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [studentUserId, setStudentUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!displayName.trim()) return;
    setSaving(true);
    setError(null);
    const { error: addError } = await addStudentToClassroom(classroomId, {
      displayName,
      email: email || undefined,
      studentUserId: studentUserId || undefined,
    });
    setSaving(false);
    if (addError) {
      setError(addError);
      return;
    }
    setDisplayName("");
    setEmail("");
    setStudentUserId("");
    onAdded();
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl bg-emerald-50/40 p-4 ring-1 ring-emerald-100"
      onSubmit={(e) => {
        e.preventDefault();
        void handleAdd();
      }}
    >
      <h3 className="font-semibold text-slate-900">Add student</h3>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Display name</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">
          Student user ID (optional — links active account)
        </span>
        <input
          value={studentUserId}
          onChange={(e) => setStudentUserId(e.target.value)}
          placeholder="UUID if known"
          className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        {saving ? "Adding…" : "Add student"}
      </button>
    </form>
  );
}

export async function handleRemoveStudent(rowId: string, onRemoved: () => void) {
  const { error } = await removeStudentFromClassroom(rowId);
  if (!error) onRemoved();
}
