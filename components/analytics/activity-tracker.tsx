"use client";

import {
  useActivityTracker,
  type ActivitySurface,
} from "@/lib/analytics/activity-tracker";

type Props = {
  surface: ActivitySurface;
  refId?: string | null;
  enabled?: boolean;
};

/**
 * Renders nothing — mounts the time-on-task tracker so server components /
 * pages can measure a screen without becoming client components themselves.
 */
export function ActivityTracker({ surface, refId = null, enabled = true }: Props) {
  useActivityTracker(surface, refId, enabled);
  return null;
}
