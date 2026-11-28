"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { JoinClassForm } from "@/components/classroom/join-class-form";
import { StudyGroupGoalsForm, describeGoals } from "@/components/classroom/study-group-goals-form";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { getSession, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  JOIN_NEEDS_SWITCH,
  createStudyGroup,
  getMyStudyGroup,
  joinClassroomByCode,
  leaveMyClassroom,
  listOpenGroups,
  setPendingClassCode,
  updateStudyGroupGoals,
  type OpenGroup,
  type StudyGroup,
} from "@/lib/supabase/classrooms";

type Panel = "create" | "edit" | "leave" | null;

export function JoinClassClient({ initialCode }: { initialCode: string }) {
  const locale = useUiLocale();
  const t = (text: string) => tr(locale, text);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [openGroups, setOpenGroups] = useState<OpenGroup[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  /** Нээлттэй бүлэг рүү шилжихийг асууж буй бүлэг. */
  const [switchTo, setSwitchTo] = useState<OpenGroup | null>(null);

  const reload = useCallback(async () => {
    const [mine, open] = await Promise.all([
      getMyStudyGroup().catch(() => null),
      listOpenGroups().catch(() => []),
    ]);
    setGroup(mine);
    setOpenGroups(open);
    setLoaded(true);
  }, []);

  useEffect(() => {
    getSession().then(({ data }) => {
      const ok = Boolean(data);
      setSignedIn(ok);
      if (ok) void reload();
    });
  }, [reload]);

  const clean = initialCode.replace(/\D/g, "").slice(0, 6);

  async function leave() {
    if (!group || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await leaveMyClassroom(group.id);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setPanel(null);
    setNotice(t("Гарлаа. Оноо, эрэмбэ чинь хадгалагдсан — кодоороо буцаж орвол үргэлжилнэ."));
    await reload();
  }

  async function joinOpen(target: OpenGroup, switchGroup = false) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const { data, error: err } = await joinClassroomByCode(target.joinCode, null, { switchGroup });
    setBusy(false);
    if (err === JOIN_NEEDS_SWITCH) {
      setSwitchTo(target);
      return;
    }
    setSwitchTo(null);
    if (err || !data) {
      setError(err ?? t("Нэгдэж чадсангүй."));
      return;
    }
    setNotice(`${t("Та бүлэгт нэгдлээ:")} ${data.classroomName}`);
    await reload();
  }

  async function copyCode() {
    if (!group?.joinCode) return;
    try {
      await navigator.clipboard.writeText(group.joinCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Хуулж чадаагүй бол код дэлгэц дээр харагдаж байгаа.
    }
  }

  const outline =
    "min-h-[44px] rounded-full border border-[var(--app-border)] bg-[var(--app-card)] px-4 text-sm font-semibold text-[var(--app-text)]";

  return (
    <MobileAppShell activeTab="profile" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader
        title={t("Хамт сурах бүлэг")}
        subtitle={t("Найзуудтайгаа бүлэг болоод зорилгоо тохир. Өдөр бүр хэн хийснийг харж, нэгнээ шахаж сур.")}
      />

      {!hasSupabaseConfig ? (
        <MobileCard>
          <p className="text-sm text-[var(--app-muted)]">Supabase тохиргоо олдсонгүй.</p>
        </MobileCard>
      ) : signedIn === false ? (
        <MobileCard>
          <div className="space-y-3">
            <JoinClassForm
              initialCode={clean}
              mode="peek"
              onCodeChange={(c, name) => setPendingClassCode(name ? c : null)}
            />
            <p className="text-sm text-[var(--app-muted)]">
              {t("Бүлэгт орохын тулд эхлээд бүртгүүлэх эсвэл нэвтэрнэ. Код хадгалагдаж, нэвтэрмэгц автоматаар нэгдэнэ.")}
            </p>
            <div className="flex gap-2">
              <Link href={`/signup?code=${clean}`} className="app-btn-primary flex-1 text-center">
                {t("Бүртгүүлэх")}
              </Link>
              <Link href="/login?next=/join" className="app-btn-secondary flex-1 text-center">
                {t("Нэвтрэх")}
              </Link>
            </div>
          </div>
        </MobileCard>
      ) : signedIn === null || !loaded ? (
        <MobileCard>
          <p className="text-sm text-[var(--app-muted)]">{t("Уншиж байна…")}</p>
        </MobileCard>
      ) : (
        <div className="space-y-4">
          {notice ? (
            <p className="rounded-2xl bg-[var(--app-primary-light)] px-4 py-3 text-sm font-semibold text-[var(--app-primary-dark)]">
              ✓ {notice}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          {group ? (
            <MobileCard>
              <p className="text-xs font-bold text-[var(--app-muted)]">
                {group.kind === "class" ? t("Миний анги") : t("Миний бүлэг")}
              </p>
              <p className="mt-0.5 text-xl font-black text-[var(--app-text)]" translate="no">
                {group.name}
              </p>
              {group.ready ? (
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  {group.memberCount} {t("хүн")}
                  {describeGoals(
                    {
                      wordsPerDay: group.goalWordsPerDay,
                      lessonsPerWeek: group.goalLessonsPerWeek,
                      testsPerWeek: group.goalTestsPerWeek,
                    },
                    t
                  )
                    ? ` · ${describeGoals(
                        {
                          wordsPerDay: group.goalWordsPerDay,
                          lessonsPerWeek: group.goalLessonsPerWeek,
                          testsPerWeek: group.goalTestsPerWeek,
                        },
                        t
                      )}`
                    : ""}
                </p>
              ) : null}

              {group.joinCode ? (
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[var(--app-primary-light)] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--app-primary-dark)]">
                      {t("Найзуудаа урих код")}
                    </p>
                    <p className="font-mono text-2xl font-black tracking-[0.2em] text-[var(--app-primary-dark)]">
                      {group.joinCode}
                    </p>
                  </div>
                  <button type="button" onClick={copyCode} className={outline}>
                    {copied ? t("Хууллаа ✓") : t("Хуулах")}
                  </button>
                </div>
              ) : null}

              {panel === "edit" ? (
                <div className="mt-4 border-t border-[var(--app-border)] pt-4">
                  <StudyGroupGoalsForm
                    initial={{
                      wordsPerDay: group.goalWordsPerDay,
                      lessonsPerWeek: group.goalLessonsPerWeek,
                      testsPerWeek: group.goalTestsPerWeek,
                      days: group.goalDays,
                    }}
                    submitLabel={t("Хадгалах")}
                    busyLabel={t("Хадгалж байна…")}
                    onCancel={() => setPanel(null)}
                    onSubmit={async (_name, goals) => {
                      const { error: err } = await updateStudyGroupGoals(group.id, goals);
                      if (err) return err;
                      setPanel(null);
                      setNotice(t("Зорилго шинэчлэгдлээ."));
                      await reload();
                      return null;
                    }}
                  />
                </div>
              ) : panel === "leave" ? (
                <div className="mt-4 space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                  <p className="font-semibold">
                    «<span translate="no">{group.name}</span>»{" "}
                    {group.kind === "class" ? t("ангиас гарах уу?") : t("бүлгээс гарах уу?")}
                  </p>
                  <p className="text-xs">{t("Оноо, эрэмбэ чинь хадгалагдана. Кодоороо буцаж орвол үргэлжилнэ.")}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={leave}
                      disabled={busy}
                      className="min-h-[44px] flex-1 rounded-full bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {busy ? t("Гарч байна…") : t("Тийм, гарах")}
                    </button>
                    <button type="button" onClick={() => setPanel(null)} className={`${outline} flex-1`}>
                      {t("Болих")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/home" className="app-btn-primary w-full basis-full text-center">
                    {t("Нүүр рүү")}
                  </Link>
                  {group.ready && group.isOwner && group.kind === "group" ? (
                    <button type="button" onClick={() => setPanel("edit")} className={`${outline} flex-1`}>
                      {t("Зорилго өөрчлөх")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setPanel("leave");
                    }}
                    className={`${outline} flex-1 text-red-700`}
                  >
                    {t("Гарах")}
                  </button>
                </div>
              )}
            </MobileCard>
          ) : null}

          <MobileCard>
            <p className="mb-2 text-base font-black text-[var(--app-text)]">
              {group ? t("Өөр бүлэгт кодоор орох") : t("Кодоор орох")}
            </p>
            <JoinClassForm
              initialCode={clean}
              currentGroupName={group?.name ?? null}
              onJoined={(name) => {
                setNotice(`${t("Та бүлэгт нэгдлээ:")} ${name}`);
                void reload();
              }}
            />
          </MobileCard>

          <MobileCard>
            <p className="text-base font-black text-[var(--app-text)]">{t("Шинэ бүлэг үүсгэх")}</p>
            {panel === "create" ? (
              <div className="mt-3">
                {group ? (
                  <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                    {t("Шинэ бүлэг үүсгэвэл одоогийн бүлгээсээ гарна (оноо хадгалагдана).")}
                  </p>
                ) : null}
                <StudyGroupGoalsForm
                  withName
                  submitLabel={t("Бүлэг үүсгэх")}
                  busyLabel={t("Үүсгэж байна…")}
                  onCancel={() => setPanel(null)}
                  onSubmit={async (name, goals) => {
                    const { data, error: err } = await createStudyGroup(name, goals);
                    if (err || !data) return err ?? t("Бүлэг үүсгэж чадсангүй.");
                    setPanel(null);
                    setNotice(`${t("Бүлэг үүслээ. Кодоо найзууддаа явуулаарай:")} ${data.joinCode}`);
                    await reload();
                    window.scrollTo({ top: 0 });
                    return null;
                  }}
                />
              </div>
            ) : (
              <>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  {t("Нэр өгөөд зорилгоо сонго. Гарсан кодоо найзууддаа явуулна.")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setPanel("create");
                  }}
                  className={`${outline} mt-3 w-full`}
                >
                  ＋ {t("Бүлэг үүсгэх")}
                </button>
              </>
            )}
          </MobileCard>

          {openGroups.length > 0 ? (
            <MobileCard>
              <p className="text-base font-black text-[var(--app-text)]">{t("Нээлттэй бүлгүүд")}</p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                {t("Найзгүй бол эндээс түвшиндээ тохирохыг сонгоод ор.")}
              </p>
              <ul className="mt-2">
                {openGroups.map((item) => {
                  const mine = group?.id === item.id;
                  const goals = describeGoals(item, t);
                  return (
                    <li
                      key={item.id}
                      className="border-t border-[var(--app-border)] py-3 first:border-t-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-[var(--app-text)]" translate="no">
                            {item.name}
                          </p>
                          <p className="text-xs text-[var(--app-muted)]">
                            {item.members} {t("хүн")}
                            {goals ? ` · ${goals}` : ""}
                          </p>
                        </div>
                        {mine ? (
                          <span className="text-xs font-bold text-[var(--app-primary-dark)]">
                            ✓ {t("Чиний бүлэг")}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => joinOpen(item)}
                            className={`${outline} disabled:opacity-50`}
                          >
                            {t("Орох")}
                          </button>
                        )}
                      </div>
                      {switchTo?.id === item.id ? (
                        <div className="mt-2 space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                          <p className="font-semibold">
                            {t("Нэг л бүлэгт байж болно. Одоогийн бүлгээсээ гараад энэ бүлэг рүү шилжих үү?")}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => joinOpen(item, true)}
                              className="app-btn-primary flex-1 disabled:opacity-50"
                            >
                              {busy ? t("Шилжиж байна…") : t("Шилжих")}
                            </button>
                            <button type="button" onClick={() => setSwitchTo(null)} className={`${outline} flex-1`}>
                              {t("Болих")}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </MobileCard>
          ) : null}
        </div>
      )}
    </MobileAppShell>
  );
}
