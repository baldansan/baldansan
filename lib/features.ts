/** Product feature flags — toggle without deleting code paths. */
export const features = {
  /** B2B / teacher / school dashboards and learner-facing org links. */
  b2b: false,
  /** Хүүхдийн YCT ном, хүүхдийн бүртгэл/нэвтрэлт — нуусан (код, өгөгдөл хэвээр). */
  kidsYct: false,
} as const;

export type AppFeatures = typeof features;
