import { HskVocabQuizClient } from "@/components/games/hsk-vocab-quiz-client";
import {
  parseQuizTypesParam,
  presetTitleForKinds,
} from "@/lib/games/hsk-quiz-presets";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ types?: string }>;
};

export default async function HskVocabQuizPage({ searchParams }: Props) {
  const { types: typesRaw } = await searchParams;
  const presetTypes = parseQuizTypesParam(typesRaw ?? null);
  const presetTitle = presetTitleForKinds(presetTypes);

  return (
    <HskVocabQuizClient presetTypes={presetTypes} presetTitle={presetTitle} />
  );
}
