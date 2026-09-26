"use client";

import { useState } from "react";
import { JoinClassForm } from "@/components/classroom/join-class-form";
import { KidAvatarPicker } from "@/components/kids/kid-avatar-picker";
import { updateKidProfile } from "@/lib/kids/client";
import { KID_NAME_MAX_LENGTH, isValidKidPin, type KidProfile } from "@/lib/kids/types";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

type Props = {
  kid: KidProfile;
  onSaved: (kid: KidProfile) => void;
  onCancel: () => void;
};

type ClassAction = "keep" | "remove" | "change";

const inputClass =
  "mt-1 w-full rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500";

/** Хүүхдийн нэр, avatar, PIN, ангийг засах. */
export function KidEditForm({ kid, onSaved, onCancel }: Props) {
  const locale = useUiLocale();
  const [name, setName] = useState(kid.displayName);
  const [avatar, setAvatar] = useState(kid.avatar);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [classAction, setClassAction] = useState<ClassAction>("keep");
  const [classCode, setClassCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (!name.trim()) {
      setError(tr(locale, "Хүүхдийн нэрийг оруулна уу."));
      return;
    }
    if (pin || pin2) {
      if (!isValidKidPin(pin)) {
        setError(tr(locale, "PIN яг 4 оронтой тоо байх ёстой."));
        return;
      }
      if (pin !== pin2) {
        setError(tr(locale, "Хоёр PIN таарахгүй байна."));
        return;
      }
    }
    if (classAction === "change" && !classCode) {
      setError(tr(locale, "Шинэ ангийн кодыг оруулна уу."));
      return;
    }
    setBusy(true);
    const res = await updateKidProfile({
      childUserId: kid.childUserId,
      displayName: name.trim(),
      avatar,
      pin: pin || undefined,
      classroomJoinCode:
        classAction === "remove" ? "" : classAction === "change" ? classCode ?? undefined : undefined,
    });
    setBusy(false);
    if (!res.data) {
      setError(res.error);
      return;
    }
    if (res.warning) setError(res.warning);
    onSaved(res.data);
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-3 border-t border-[var(--app-border)] pt-3">
      <label className="block text-sm font-medium text-[var(--app-text)]">
        {tr(locale, "Хүүхдийн нэр")}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={KID_NAME_MAX_LENGTH}
          className={inputClass}
          translate="no"
          required
        />
      </label>

      <KidAvatarPicker value={avatar} onChange={setAvatar} />

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm font-medium text-[var(--app-text)]">
          {tr(locale, "Шинэ PIN")}
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
            className={`${inputClass} font-mono tracking-[0.4em]`}
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
            placeholder="••••"
            className={`${inputClass} font-mono tracking-[0.4em]`}
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-[var(--app-muted)]">
        {tr(locale, "PIN солихгүй бол хоосон орхино.")}
      </p>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[var(--app-text)]">{tr(locale, "Анги")}</legend>
        <div className="flex flex-wrap gap-2 text-sm">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="radio"
              name={`class-${kid.childUserId}`}
              checked={classAction === "keep"}
              onChange={() => setClassAction("keep")}
            />
            {kid.classroomName ? (
              <span>
                {tr(locale, "Хэвээр:")} <span translate="no">{kid.classroomName}</span>
              </span>
            ) : (
              tr(locale, "Хэвээр")
            )}
          </label>
          {kid.classroomId ? (
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name={`class-${kid.childUserId}`}
                checked={classAction === "remove"}
                onChange={() => setClassAction("remove")}
              />
              {tr(locale, "Ангиас гаргах")}
            </label>
          ) : null}
          <label className="inline-flex items-center gap-1.5">
            <input
              type="radio"
              name={`class-${kid.childUserId}`}
              checked={classAction === "change"}
              onChange={() => setClassAction("change")}
            />
            {tr(locale, kid.classroomId ? "Өөр ангид шилжүүлэх" : "Ангид нэмэх")}
          </label>
        </div>
        {classAction === "change" ? (
          <JoinClassForm mode="peek" onCodeChange={(code, className) => setClassCode(className ? code : null)} />
        ) : null}
      </fieldset>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">{error}</p>
      ) : null}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="app-btn-primary flex-1 disabled:opacity-50">
          {busy ? tr(locale, "Хадгалж байна…") : tr(locale, "Хадгалах")}
        </button>
        <button type="button" onClick={onCancel} className="app-btn-secondary">
          {tr(locale, "Болих")}
        </button>
      </div>
    </form>
  );
}
