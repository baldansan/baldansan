"use client";

import { useState } from "react";
import { JoinClassForm } from "@/components/classroom/join-class-form";
import { KidAvatarPicker } from "@/components/kids/kid-avatar-picker";
import { KidsServiceRoleNotice } from "@/components/kids/kids-service-role-notice";
import { createKidProfile } from "@/lib/kids/client";
import { DEFAULT_KID_AVATAR, KID_NAME_MAX_LENGTH, isValidKidPin, type KidProfile } from "@/lib/kids/types";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

type Props = {
  /** Багшийн ангийн хуудаснаас: хүүхдийг энэ ангид шууд нэмнэ (ангийн код асуухгүй). */
  classroomId?: string;
  compact?: boolean;
  onCreated?: (kid: KidProfile) => void;
  onCancel?: () => void;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500";

/** Хүүхэд нэмэх маягт: нэр, avatar, 4 оронтой PIN ×2, (сонголттой) ангийн код. */
export function KidCreateForm({ classroomId, compact = false, onCreated, onCancel }: Props) {
  const locale = useUiLocale();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(DEFAULT_KID_AVATAR);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [classCode, setClassCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceRoleMissing, setServiceRoleMissing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setWarning(null);
    if (!name.trim()) {
      setError(tr(locale, "Хүүхдийн нэрийг оруулна уу."));
      return;
    }
    if (!isValidKidPin(pin)) {
      setError(tr(locale, "PIN яг 4 оронтой тоо байх ёстой."));
      return;
    }
    if (pin !== pin2) {
      setError(tr(locale, "Хоёр PIN таарахгүй байна."));
      return;
    }
    setBusy(true);
    const res = await createKidProfile({
      displayName: name.trim(),
      avatar,
      pin,
      classroomId: classroomId ?? null,
      classroomJoinCode: classroomId ? null : classCode,
    });
    setBusy(false);
    if (!res.data) {
      setServiceRoleMissing(Boolean(res.serviceRoleMissing));
      setError(res.error);
      return;
    }
    setWarning(res.warning ?? null);
    setName("");
    setPin("");
    setPin2("");
    setClassCode(null);
    setAvatar(DEFAULT_KID_AVATAR);
    setFormKey((k) => k + 1);
    onCreated?.(res.data);
  }

  if (serviceRoleMissing) {
    return <KidsServiceRoleNotice />;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="block text-sm font-medium text-[var(--app-text)]">
        {tr(locale, "Хүүхдийн нэр")}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={KID_NAME_MAX_LENGTH}
          placeholder={tr(locale, "Жишээ: Тогтуун")}
          className={inputClass}
          translate="no"
          required
        />
      </label>

      <KidAvatarPicker value={avatar} onChange={setAvatar} compact={compact} />

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm font-medium text-[var(--app-text)]">
          {tr(locale, "PIN (4 орон)")}
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className={`${inputClass} font-mono tracking-[0.4em]`}
            required
          />
        </label>
        <label className="block text-sm font-medium text-[var(--app-text)]">
          {tr(locale, "PIN дахин")}
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={4}
            value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className={`${inputClass} font-mono tracking-[0.4em]`}
            required
          />
        </label>
      </div>

      {!classroomId ? (
        <div>
          <JoinClassForm
            key={formKey}
            mode="peek"
            onCodeChange={(code, className) => setClassCode(className ? code : null)}
          />
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {tr(locale, "Сургууль/ангийн сурагч биш бол хоосон орхино.")}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">{error}</p>
      ) : null}
      {warning ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">{warning}</p>
      ) : null}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="app-btn-primary flex-1 disabled:opacity-50">
          {busy ? tr(locale, "Үүсгэж байна…") : tr(locale, "Хүүхэд нэмэх")}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="app-btn-secondary">
            {tr(locale, "Болих")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
