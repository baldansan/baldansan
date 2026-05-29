import {
  ACHIEVEMENTS,
  buildProgressSummaryForAchievements,
  evaluateAchievementForActivity,
  evaluateAchievementsFromProgress,
} from "@/lib/engagement/achievements";
import {
  addLocalAchievement,
  addLocalNotification,
  getLocalAchievements,
  hasLocalAchievement,
} from "@/lib/engagement/local-engagement";
import type { ActivityType } from "@/lib/retention/types";
import { getStreakUnified } from "@/lib/retention/retention-service";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  awardAchievement,
  createUserNotification,
  getUserAchievements,
} from "@/lib/supabase/engagement";

async function getExistingAchievementKeys(): Promise<Set<string>> {
  const local = getLocalAchievements().map((item) => item.achievementKey);
  const keys = new Set(local);

  if (hasSupabaseConfig) {
    const { userId } = await getAuthenticatedUserId();
    if (userId) {
      const remote = await getUserAchievements();
      for (const item of remote.data ?? []) {
        keys.add(item.achievementKey);
      }
    }
  }

  return keys;
}

async function notifyAchievementUnlocked(title: string, description: string) {
  addLocalNotification({
    notificationType: "achievement",
    title: `Achievement unlocked: ${title}`,
    message: description,
    actionHref: "/profile",
  });

  if (!hasSupabaseConfig) return;
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return;

  await createUserNotification({
    notificationType: "achievement",
    title: `Achievement unlocked: ${title}`,
    message: description,
    actionHref: "/profile",
  });
}

async function grantAchievement(key: string): Promise<boolean> {
  const def = ACHIEVEMENTS[key];
  if (!def) return false;

  if (hasLocalAchievement(key)) {
    return false;
  }

  addLocalAchievement({
    achievementKey: def.key,
    title: def.title,
    description: def.description,
    earnedAt: new Date().toISOString(),
  });

  if (hasSupabaseConfig) {
    const { userId } = await getAuthenticatedUserId();
    if (userId) {
      await awardAchievement(def.key, def.title, def.description);
    }
  }

  await notifyAchievementUnlocked(def.title, def.description);
  return true;
}

export async function evaluateAndAwardAchievements(
  activityType?: ActivityType
): Promise<string[]> {
  const existingKeys = await getExistingAchievementKeys();
  const progress = buildProgressSummaryForAchievements();
  const retention = await getStreakUnified();

  const fromProgress = evaluateAchievementsFromProgress(
    progress,
    retention,
    existingKeys
  );

  const newlyEarned: string[] = [];

  for (const def of fromProgress) {
    if (await grantAchievement(def.key)) {
      newlyEarned.push(def.key);
      existingKeys.add(def.key);
    }
  }

  if (activityType) {
    const activityDef = evaluateAchievementForActivity(activityType, existingKeys);
    if (activityDef && (await grantAchievement(activityDef.key))) {
      newlyEarned.push(activityDef.key);
    }
  }

  return newlyEarned;
}

export async function checkDueRemindersAndNotify(): Promise<number> {
  const { getRemindersUnified, markReminderShownUnified } = await import(
    "@/lib/engagement/engagement-service"
  );
  const { isReminderDueNow } = await import("@/lib/engagement/local-engagement");

  const reminders = await getRemindersUnified();
  let shown = 0;

  for (const reminder of reminders) {
    if (!isReminderDueNow(reminder)) continue;

    addLocalNotification({
      notificationType: "reminder",
      title: reminder.title,
      message: "In-app study reminder — цаг боллоо.",
      actionHref: "/courses/hsk5",
    });

    if (hasSupabaseConfig) {
      const { userId } = await getAuthenticatedUserId();
      if (userId) {
        await createUserNotification({
          notificationType: "reminder",
          title: reminder.title,
          message: "In-app study reminder — цаг боллоо.",
          actionHref: "/courses/hsk5",
        });
      }
    }

    await markReminderShownUnified(reminder.id);
    shown += 1;
  }

  return shown;
}
