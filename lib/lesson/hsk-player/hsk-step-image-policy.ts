import type { HskGuidedStepKind } from "@/lib/lesson/hsk-guided-step";
import type { HskMediaImage, HskMediaImageVariant } from "@/lib/lesson/hsk-media";

export type HskStepImageDisplayMode = "hero" | "illustration" | "standard" | "hidden";

const NATIVE_UI_STEP_TYPES = new Set<HskGuidedStepKind>([
  "pinyin",
  "tones",
  "dialogue",
  "common-mistake",
  "vocabulary",
  "practice-menu",
]);

const BAKED_UI_IMAGE_PATTERNS = [
  "infographic",
  "practice-menu",
  "practice-panel",
  "practice-grid",
  "practice-cards",
  "tone-board",
  "tone-panel",
  "pinyin-map",
  "pinyin-panel",
  "dialogue-panel",
  "dialogue-cards",
  "ui-panel",
  "card-grid",
  "-menu",
  "-buttons",
  "-cards",
  "mistake-panel",
  "correction-panel",
];

/** Package images that embed buttons, cards, or lesson text meant to be app-rendered. */
export function isBakedUiInfographicImage(image: HskMediaImage | null | undefined): boolean {
  if (!image) return false;

  const role = image.role?.toLowerCase() ?? "";
  if (role === "illustration" || role === "scene" || role === "helper") {
    return false;
  }
  if (role === "infographic" || role === "ui" || role === "panel" || role === "screen") {
    return true;
  }

  const haystack = `${image.id} ${image.file} ${image.section ?? ""}`.toLowerCase();
  return BAKED_UI_IMAGE_PATTERNS.some((pattern) => haystack.includes(pattern));
}

function isCamelSceneIllustration(image: HskMediaImage): boolean {
  const haystack = `${image.id} ${image.file} ${image.role ?? ""}`.toLowerCase();
  return (
    haystack.includes("illustration") ||
    haystack.includes("scene") ||
    haystack.includes("helper") ||
    (haystack.includes("camel") && !haystack.includes("board") && !haystack.includes("panel"))
  );
}

/**
 * Decide whether a guided-step image should render and how.
 * Images are visual helpers only — lesson text always comes from app UI.
 */
export function resolveHskStepImageDisplay(input: {
  stepType?: string;
  image: HskMediaImage | null;
}): {
  mode: HskStepImageDisplayMode;
  variant: HskMediaImageVariant;
  caption?: string;
} {
  const stepType = (input.stepType ?? "") as HskGuidedStepKind;
  const image = input.image;

  if (!image) {
    return { mode: "hidden", variant: "standard" };
  }

  if (stepType === "practice-menu") {
    return { mode: "hidden", variant: "standard" };
  }

  const baked = isBakedUiInfographicImage(image);

  if (stepType === "teacher-intro" || stepType === "key-phrase" || stepType === "complete") {
    return { mode: "hero", variant: "hero" };
  }

  if (NATIVE_UI_STEP_TYPES.has(stepType)) {
    if (baked && !isCamelSceneIllustration(image)) {
      return { mode: "hidden", variant: "standard" };
    }
    return {
      mode: "illustration",
      variant: "illustration",
      caption: "Багшийн зураг — доор app-аар хичээлийн агуулга харагдана.",
    };
  }

  if (baked) {
    return { mode: "hidden", variant: "standard" };
  }

  return { mode: "standard", variant: "standard" };
}

export function mapDisplayModeToVariant(mode: HskStepImageDisplayMode): HskMediaImageVariant {
  if (mode === "hero") return "hero";
  if (mode === "illustration") return "illustration";
  if (mode === "standard") return "standard";
  return "standard";
}
