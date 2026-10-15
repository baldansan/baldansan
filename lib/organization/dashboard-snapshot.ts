import { isDemoId } from "@/lib/demo-data";
import {
  computeLearnerScore,
  summarizeGrades,
  ACTIVE_MINUTES_TARGET,
  LEARNED_WORDS_TARGET,
  type LearnerGradeBucket,
} from "@/lib/learner-grade";
import {
  WEAK_SPOT_AREA_LABELS,
  buildAreaStats,
  isGradedAttempt,
  type WeakSpotAttempt,
} from "@/lib/analytics/weak-spots";
import { resolvePassThreshold, scoreFromAttempt } from "@/lib/classroom/exam-types";
import type { HskAttemptScoreMetadata } from "@/lib/mock-test/hsk-scoring";
import type {
  AttendanceCounts,
  DashClass,
  DashExam,
  DashMissedQuestion,
  DashPerson,
  DashSnapshot,
  DashTeacher,
  DashTopStudent,
} from "@/lib/organization/dashboard-types";

/**
 * Pure aggregation: raw table rows in, one dashboard snapshot out.
 * No I/O, never throws. Nothing is invented — missing data stays null.
 */

export type Row = Record<string, unknown>;

export type DashboardRaw = {
  today: string;
  classrooms: Row[];
  students: Row[];
  teacherNames: Map<string, string>;
  assignments: Row[];
  results: Row[];
  attendance: Row[];
  exams: Row[];
  testLevels: Map<string, number>;
  testAttempts: Row[];
  quizAttempts: Row[];
  sessions: Row[];
  daily: Row[];
  lessons: Row[];
  qAttempts: Row[];
  qTexts: Map<string, string>;
  points: Map<string, { total: number; last7: number; prev7: number }> | null;
  classPoints: Map<string, { total: number; avg: number }> | null;
  ranking: { userId: string; name: string; points: number; rank: number; isDemo: boolean }[] | null;
};

const s = (v: unknown): string | null => (v == null || String(v).trim() === "" ? null : String(v).trim());
const n = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pct = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 100) : null);
const mean = (xs: number[]): number | null =>
  xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;

export function addDays(day: string, delta: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + delta * 86_400_000).toISOString().slice(0, 10);
}

/** Ulaanbaatar / Hohhot are both UTC+8. */
export function dayOf(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t + 8 * 3_600_000).toISOString().slice(0, 10) : null;
}

export function todayUB(): string {
  return new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
}

const EMPTY_ATT: AttendanceCounts = { present: 0, late: 0, absent: 0, excused: 0 };

/** Question keys worth looking up text for (called once by the loader). */
export function topMissedKeys(rows: Row[], limit = 60): { lessonId: string; questionId: string }[] {
  const m = new Map<string, { lessonId: string; questionId: string; wrong: number }>();
  for (const r of rows) {
    if (r.is_correct !== false || String(r.selected_answer ?? "").startsWith("self_")) continue;
    const lessonId = s(r.lesson_id);
    const questionId = s(r.question_id);
    if (!lessonId || !questionId) continue;
    const k = `${lessonId}:${questionId}`;
    const e = m.get(k) ?? { lessonId, questionId, wrong: 0 };
    e.wrong += 1;
    m.set(k, e);
  }
  return [...m.values()].sort((a, b) => b.wrong - a.wrong).slice(0, limit);
}

export function buildSnapshot(raw: DashboardRaw, includeDemo: boolean): DashSnapshot {
  const { today } = raw;
  const d7 = addDays(today, -6);
  const p7a = addDays(today, -13);
  const p7b = addDays(today, -7);
  const d30 = addDays(today, -29);

  const classrooms = raw.classrooms.filter((c) => {
    const id = s(c.id);
    return id && (includeDemo || !isDemoId(id));
  });
  const classIds = new Set(classrooms.map((c) => String(c.id)));
  const className = new Map(classrooms.map((c) => [String(c.id), s(c.name) ?? "Анги"]));

  // roster
  const roster = new Map<string, { rowId: string; userId: string | null; name: string }[]>();
  const nameByUser = new Map<string, string>();
  const classOfUser = new Map<string, string>();
  for (const r of raw.students) {
    const cid = s(r.classroom_id);
    const rowId = s(r.id);
    if (!cid || !rowId || !classIds.has(cid) || s(r.status) === "removed") continue;
    const userId = s(r.student_user_id);
    const name = s(r.display_name) ?? "Нэргүй сурагч";
    if (userId) {
      nameByUser.set(userId, name);
      if (!classOfUser.has(userId)) classOfUser.set(userId, cid);
    }
    const list = roster.get(cid) ?? [];
    list.push({ rowId, userId, name });
    roster.set(cid, list);
  }

  // activity days per user
  const days = new Map<string, Set<string>>();
  const mark = (u: string | null, d: string | null) => {
    if (!u || !d) return;
    (days.get(u) ?? days.set(u, new Set()).get(u)!).add(d);
  };
  const minutesByDay = new Map<string, number>();
  const secs30 = new Map<string, number>();
  for (const r of raw.sessions) {
    const u = s(r.user_id);
    const d = s(r.day);
    const sec = n(r.seconds);
    if (!u || !d || sec <= 0 || !classOfUser.has(u)) continue;
    mark(u, d);
    minutesByDay.set(d, (minutesByDay.get(d) ?? 0) + sec / 60);
    if (d >= d30) secs30.set(u, (secs30.get(u) ?? 0) + sec);
  }
  for (const r of raw.daily) if (classOfUser.has(String(r.user_id))) mark(s(r.user_id), s(r.activity_date));
  const quizByUser = new Map<string, number[]>();
  const quiz30 = new Map<string, number[]>();
  for (const r of raw.quizAttempts) {
    const u = s(r.user_id);
    if (!u || !classOfUser.has(u)) continue;
    const d = dayOf(s(r.created_at));
    mark(u, d);
    const p = n(r.percentage);
    (quizByUser.get(u) ?? quizByUser.set(u, []).get(u)!).push(p);
    if (d && d >= d30) (quiz30.get(u) ?? quiz30.set(u, []).get(u)!).push(p);
  }
  const wk: WeakSpotAttempt[] = [];
  const qCounts = new Map<string, { lessonId: string; questionId: string; total: number; wrong: number }>();
  for (const r of raw.qAttempts) {
    const u = s(r.user_id);
    if (!u || !classOfUser.has(u)) continue;
    mark(u, dayOf(s(r.created_at)));
    const a: WeakSpotAttempt = {
      lessonId: s(r.lesson_id) ?? "",
      stage: s(r.stage) ?? "",
      questionId: s(r.question_id) ?? "",
      questionType: s(r.question_type) ?? "",
      isCorrect: r.is_correct === true,
      selectedAnswer: s(r.selected_answer),
      correctAnswer: s(r.correct_answer),
      createdAt: s(r.created_at) ?? "",
    };
    if (!isGradedAttempt(a)) continue;
    wk.push(a);
    const k = `${a.lessonId}:${a.questionId}`;
    const e = qCounts.get(k) ?? { lessonId: a.lessonId, questionId: a.questionId, total: 0, wrong: 0 };
    e.total += 1;
    if (!a.isCorrect) e.wrong += 1;
    qCounts.set(k, e);
  }
  const lessonsDone = new Map<string, number>();
  for (const r of raw.lessons) {
    const u = s(r.user_id);
    if (u) lessonsDone.set(u, (lessonsDone.get(u) ?? 0) + 1);
  }

  // exam attempts → latest per user+test
  const latestAttempt = new Map<string, Row>();
  const mockPct = new Map<string, number[]>();
  for (const r of raw.testAttempts) {
    const u = s(r.user_id);
    if (!u || !classOfUser.has(u) || !s(r.finished_at)) continue;
    mark(u, dayOf(s(r.finished_at)));
    if (n(r.max_score) > 0) (mockPct.get(u) ?? mockPct.set(u, []).get(u)!).push((n(r.raw_score) / n(r.max_score)) * 100);
    const k = `${u}|${s(r.test_id)}`;
    const prev = latestAttempt.get(k);
    if (!prev || String(r.finished_at) > String(prev.finished_at)) latestAttempt.set(k, r);
  }

  const activeIn = (users: string[], from: string, to: string) =>
    users.filter((u) => [...(days.get(u) ?? [])].some((d) => d >= from && d <= to)).length;

  // attendance by class and by roster row
  const attByClass = new Map<string, AttendanceCounts>();
  const attByRow = new Map<string, { ok: number; all: number }>();
  for (const r of raw.attendance) {
    const cid = s(r.classroom_id);
    const st = s(r.status) as keyof AttendanceCounts | null;
    if (!cid || !classIds.has(cid) || !st || !(st in EMPTY_ATT)) continue;
    const c = attByClass.get(cid) ?? { ...EMPTY_ATT };
    c[st] += 1;
    attByClass.set(cid, c);
    if (st !== "excused") {
      const rowId = String(r.student_id);
      const e = attByRow.get(rowId) ?? { ok: 0, all: 0 };
      e.all += 1;
      if (st !== "absent") e.ok += 1;
      attByRow.set(rowId, e);
    }
  }

  // assignments
  const assignClass = new Map<string, string>();
  const assignCount = new Map<string, number>();
  for (const r of raw.assignments) {
    const cid = s(r.classroom_id);
    const id = s(r.id);
    if (!cid || !id || !classIds.has(cid)) continue;
    assignClass.set(id, cid);
    assignCount.set(cid, (assignCount.get(cid) ?? 0) + 1);
  }
  const doneByClass = new Map<string, number>();
  for (const r of raw.results) {
    const cid = assignClass.get(String(r.assignment_id));
    if (cid && s(r.status) === "completed") doneByClass.set(cid, (doneByClass.get(cid) ?? 0) + 1);
  }

  // exams
  const examsOut: DashExam[] = [];
  const examPool = new Map<string, { pcts: number[]; passed: number; failed: number }>();
  const failedLast = new Set<string>();
  const examsByClass = new Map<string, Row[]>();
  for (const e of raw.exams) {
    const cid = s(e.classroom_id);
    if (cid && classIds.has(cid)) (examsByClass.get(cid) ?? examsByClass.set(cid, []).get(cid)!).push(e);
  }
  for (const [cid, list] of examsByClass) {
    list.sort((a, b) => String(b.scheduled_for ?? b.created_at ?? "").localeCompare(String(a.scheduled_for ?? a.created_at ?? "")));
    const linked = (roster.get(cid) ?? []).filter((x) => x.userId);
    const pool = examPool.get(cid) ?? { pcts: [], passed: 0, failed: 0 };
    list.forEach((e, idx) => {
      const testId = s(e.test_id) ?? "";
      const th = resolvePassThreshold(raw.testLevels.get(testId) ?? null);
      const pcts: number[] = [];
      let passed = 0;
      let failed = 0;
      let sat = 0;
      for (const st of linked) {
        const a = latestAttempt.get(`${st.userId}|${testId}`);
        if (!a) continue;
        sat += 1;
        const sc = scoreFromAttempt(
          {
            id: String(a.id),
            userId: String(a.user_id),
            testId,
            finishedAt: s(a.finished_at),
            rawScore: a.raw_score == null ? null : n(a.raw_score),
            maxScore: a.max_score == null ? null : n(a.max_score),
            metadata: (a.score_metadata ?? null) as HskAttemptScoreMetadata | null,
          },
          th
        );
        if (sc.percentage != null) pcts.push(sc.percentage);
        if (sc.passed === true) passed += 1;
        if (sc.passed === false) {
          failed += 1;
          if (idx === 0 && st.userId) failedLast.add(st.userId);
        }
      }
      pool.pcts.push(...pcts);
      pool.passed += passed;
      pool.failed += failed;
      examsOut.push({
        examId: String(e.id),
        classroomName: className.get(cid) ?? "Анги",
        title: s(e.title) ?? testId,
        date: s(e.scheduled_for),
        total: linked.length,
        sat,
        avgPct: mean(pcts),
        passPct: pct(passed, passed + failed),
      });
    });
    examPool.set(cid, pool);
  }
  const examsRecent = [...examsOut]
    .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")))
    .slice(0, 5);

  // per-class
  const weekStarts = Array.from({ length: 8 }, (_, k) => addDays(today, -6 - 7 * (7 - k)));
  const raws: { c: DashClass; linked: string[]; done: number; assigned: number; secs: number; passed: number; failed: number; ptsSum: number }[] = [];
  for (const cl of classrooms) {
    const cid = String(cl.id);
    const rows = roster.get(cid) ?? [];
    const linked = [...new Set(rows.map((r) => r.userId).filter((u): u is string => !!u))];
    const act = activeIn(linked, d7, today);
    const actPrev = activeIn(linked, p7a, p7b);
    const att = attByClass.get(cid) ?? { ...EMPTY_ATT };
    const pool = examPool.get(cid);
    const quiz = linked.flatMap((u) => quiz30.get(u) ?? []);
    const secs = linked.reduce((a, u) => a + (secs30.get(u) ?? 0), 0);
    const buckets: LearnerGradeBucket[] = linked.map((u) => {
      const q = quizByUser.get(u) ?? [];
      const m = mockPct.get(u) ?? [];
      const minutes = (secs30.get(u) ?? 0) / 60;
      return computeLearnerScore({
        quizAttempts: q.length,
        quizAveragePercent: q.length ? q.reduce((a, b) => a + b, 0) / q.length : null,
        mockAttempts: m.length,
        mockAveragePercent: m.length ? m.reduce((a, b) => a + b, 0) / m.length : null,
        completedLessons: lessonsDone.get(u) ?? 0,
        // Word progress is too heavy to read for a whole school; mirror the
        // minutes ratio so the activity part is judged by study time alone.
        learnedWords: Math.round((minutes / ACTIVE_MINUTES_TARGET) * LEARNED_WORDS_TARGET),
        activeMinutes: minutes,
      }).grade;
    });
    const cp = raw.classPoints?.get(cid);
    const ptsSum = raw.points ? linked.reduce((a, u) => a + (raw.points!.get(u)?.total ?? 0), 0) : 0;
    const assigned = (assignCount.get(cid) ?? 0) * linked.length;
    const done = doneByClass.get(cid) ?? 0;
    const tid = s(cl.teacher_user_id);
    const c: DashClass = {
      classroomId: cid,
      name: s(cl.name) ?? "Анги",
      isDemo: isDemoId(cid),
      teacherId: tid,
      teacherName: tid ? (raw.teacherNames.get(tid) ?? `Багш ${tid.slice(0, 6)}`) : "Багш оноогоогүй",
      students: rows.length,
      linkedStudents: linked.length,
      activeStudents: act,
      activePct: pct(act, linked.length),
      trend: linked.length ? pct(act, linked.length)! - pct(actPrev, linked.length)! : null,
      attendancePct: pct(att.present + att.late, att.present + att.late + att.absent),
      attendance: att,
      examAvgPct: pool ? mean(pool.pcts) : null,
      examPassPct: pool ? pct(pool.passed, pool.passed + pool.failed) : null,
      quizAccuracyPct: mean(quiz),
      hoursPerStudent: linked.length ? Math.round((secs / 3600 / linked.length) * 10) / 10 : null,
      assignmentCompletionPct: assigned ? Math.min(100, pct(done, assigned)!) : null,
      avgPoints: cp ? Math.round(cp.avg) : raw.points && linked.length ? Math.round(ptsSum / linked.length) : null,
      totalPoints: cp ? Math.round(cp.total) : raw.points ? ptsSum : null,
      pointsRank: null,
      distribution: summarizeGrades(buckets),
      weekly: weekStarts.map((w) => (linked.length ? pct(activeIn(linked, w, addDays(w, 6)), linked.length) : null)),
    };
    raws.push({ c, linked, done, assigned, secs, passed: pool?.passed ?? 0, failed: pool?.failed ?? 0, ptsSum });
  }
  const ranked = raws.filter((r) => r.c.avgPoints != null).sort((a, b) => b.c.avgPoints! - a.c.avgPoints!);
  ranked.forEach((r, i) => (r.c.pointsRank = i + 1));

  // teachers
  const byTeacher = new Map<string, typeof raws>();
  for (const r of raws) (byTeacher.get(r.c.teacherId ?? "-") ?? byTeacher.set(r.c.teacherId ?? "-", []).get(r.c.teacherId ?? "-")!).push(r);
  const teachers: DashTeacher[] = [...byTeacher.values()].map((rs) => {
    const linked = rs.reduce((a, r) => a + r.linked.length, 0);
    const att = rs.reduce((a, r) => a + r.c.attendance.present + r.c.attendance.late, 0);
    const attAll = rs.reduce((a, r) => a + r.c.attendance.present + r.c.attendance.late + r.c.attendance.absent, 0);
    const pass = rs.reduce((a, r) => a + r.passed, 0);
    const fail = rs.reduce((a, r) => a + r.failed, 0);
    const assigned = rs.reduce((a, r) => a + r.assigned, 0);
    const pts = rs.filter((r) => r.c.avgPoints != null);
    return {
      teacherId: rs[0].c.teacherId,
      name: rs[0].c.teacherName,
      classes: rs.length,
      students: rs.reduce((a, r) => a + r.c.students, 0),
      avgPoints: pts.length ? Math.round(pts.reduce((a, r) => a + r.c.avgPoints! * r.linked.length, 0) / Math.max(1, pts.reduce((a, r) => a + r.linked.length, 0))) : null,
      attendancePct: pct(att, attAll),
      examPassPct: pct(pass, pass + fail),
      completionPct: assigned ? Math.min(100, pct(rs.reduce((a, r) => a + r.done, 0), assigned)!) : null,
      hoursPerStudent: linked ? Math.round((rs.reduce((a, r) => a + r.secs, 0) / 3600 / linked) * 10) / 10 : null,
      activePct: pct(rs.reduce((a, r) => a + r.c.activeStudents, 0), linked),
    };
  }).sort((a, b) => (b.avgPoints ?? -1) - (a.avgPoints ?? -1));

  // hero + trends
  const allUsers = [...classOfUser.keys()];
  const act7 = activeIn(allUsers, d7, today);
  const actPrev7 = activeIn(allUsers, p7a, p7b);
  const dayList = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const activeDaily = dayList.map((d) => allUsers.filter((u) => days.get(u)?.has(d)).length);
  const attAll = raws.reduce((a, r) => ({
    ok: a.ok + r.c.attendance.present + r.c.attendance.late,
    all: a.all + r.c.attendance.present + r.c.attendance.late + r.c.attendance.absent,
  }), { ok: 0, all: 0 });
  const passAll = raws.reduce((a, r) => ({ p: a.p + r.passed, f: a.f + r.failed }), { p: 0, f: 0 });
  const last7 = raw.points ? allUsers.reduce((a, u) => a + (raw.points!.get(u)?.last7 ?? 0), 0) : null;
  const prev7 = raw.points ? allUsers.reduce((a, u) => a + (raw.points!.get(u)?.prev7 ?? 0), 0) : null;

  // weak spots
  const weakAreas = buildAreaStats(wk).map((a) => ({
    area: a.area,
    label: WEAK_SPOT_AREA_LABELS[a.area],
    total: a.total,
    wrong: a.wrong,
    accuracyPct: a.accuracyPct,
  }));
  const missed: DashMissedQuestion[] = [...qCounts.values()]
    .filter((q) => q.total >= 3 && q.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || b.wrong / b.total - a.wrong / a.total)
    .slice(0, 10)
    .map((q) => ({
      key: `${q.lessonId}:${q.questionId}`,
      questionId: q.questionId,
      lessonId: q.lessonId,
      text: raw.qTexts.get(`${q.lessonId}:${q.questionId}`) ?? null,
      attempts: q.total,
      wrongPct: Math.round((q.wrong / q.total) * 100),
    }));

  // top students
  let top: DashTopStudent[] = [];
  const base = raw.ranking ?? (raw.points
    ? [...raw.points.entries()]
        .filter(([u]) => classOfUser.has(u))
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 30)
        .map(([u, p], i) => ({ userId: u, name: nameByUser.get(u) ?? "Сурагч", points: p.total, rank: i + 1, isDemo: isDemoId(u) }))
    : null);
  if (base) {
    const total = Math.max(allUsers.length, 1);
    top = base
      .filter((r) => includeDemo || !(r.isDemo || isDemoId(r.userId)))
      .filter((r) => r.points > 0)
      .slice(0, 10)
      .map((r, i) => {
        const p = raw.points?.get(r.userId);
        return {
          userId: r.userId,
          name: r.name || nameByUser.get(r.userId) || "Сурагч",
          points: r.points,
          rank: i + 1,
          delta: p ? p.last7 - p.prev7 : null,
          percentile: Math.max(0, Math.round(100 * (1 - (i + 1) / total))),
          isDemo: r.isDemo || isDemoId(r.userId),
        };
      });
  }

  // attention
  const attention: DashPerson[] = [];
  for (const [cid, rows] of roster) {
    for (const st of rows) {
      const reasons: string[] = [];
      if (st.userId) {
        const last = [...(days.get(st.userId) ?? [])].sort().pop();
        if (!last || last < d7) {
          reasons.push("7+ хоног идэвхгүй");
        }
        if (failedLast.has(st.userId)) reasons.push("Сүүлийн шалгалтад тэнцээгүй");
      }
      const a = attByRow.get(st.rowId);
      if (a && a.all >= 3 && a.ok / a.all < 0.7) reasons.push(`Ирц ${Math.round((a.ok / a.all) * 100)}%`);
      if (reasons.length) {
        attention.push({ id: st.rowId, name: st.name, className: className.get(cid) ?? "Анги", isDemo: isDemoId(cid), reasons });
      }
    }
  }
  attention.sort((a, b) => b.reasons.length - a.reasons.length);

  return {
    hero: {
      students: [...roster.values()].reduce((a, r) => a + r.length, 0),
      teachers: new Set(classrooms.map((c) => s(c.teacher_user_id)).filter(Boolean)).size,
      classes: classrooms.length,
      activePct: pct(act7, allUsers.length),
      activePctDelta: allUsers.length ? pct(act7, allUsers.length)! - pct(actPrev7, allUsers.length)! : null,
      attendancePct: pct(attAll.ok, attAll.all),
      examPassPct: pct(passAll.p, passAll.p + passAll.f),
      pointsWeek: last7,
      pointsDelta: last7 != null && prev7 != null ? last7 - prev7 : null,
      activeToday: allUsers.filter((u) => days.get(u)?.has(today)).length,
      activeSpark: activeDaily.slice(-14),
    },
    classes: raws.map((r) => r.c),
    teachers,
    daily: {
      labels: dayList.map((d) => d.slice(5).replace("-", "/")),
      active: activeDaily,
      minutes: dayList.map((d) => Math.round(minutesByDay.get(d) ?? 0)),
    },
    weekLabels: weekStarts.map((w) => w.slice(5).replace("-", "/")),
    weakAreas,
    missed,
    top,
    attention: attention.slice(0, 20),
    exams: examsRecent,
  };
}
