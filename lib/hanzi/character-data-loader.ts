import type { CharDataLoaderFn } from "hanzi-writer";

/** Load stroke JSON from hanzi-writer-data via the /api/hanzi route. */
export const localHanziCharDataLoader: CharDataLoaderFn = (char, onLoad, onError) => {
  fetch(`/api/hanzi/${encodeURIComponent(char)}`)
    .then((res) => {
      if (!res.ok) throw new Error(`Missing stroke data for ${char}`);
      return res.json();
    })
    .then((data) => onLoad(data))
    .catch((err: unknown) => {
      onError(err instanceof Error ? err : new Error(String(err)));
    });
};
