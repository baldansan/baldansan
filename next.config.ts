import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ханзны зурлага (hanzi-writer-data, 47MB) одоо jsdelivr CDN-ээс — function-д багцлахгүй.
  outputFileTracingIncludes: {
    // «Уншлагын сан / 文库» — content/open/ доторх JSON-уудыг fs-ээр уншина.
    "/library": ["./content/open/**/*.json"],
    "/library/**": ["./content/open/**/*.json"],
    // «Бичих дэвтэр» — ханз таних API нь үгийн сан + ханзны толийг fs-ээр уншина.
    "/api/writing/**": ["./data/hsk_words.json", "./public/data/hsk_char_gloss.json"],
    // «Үе давах» — үеийн үгийн багц нь hsk_words.json-г fs-ээр уншина.
    "/api/games/level-deck": ["./data/hsk_words.json"],
    // «Дуудлага / 发音» — пиньинь самбар, аялгуу хос, үгийн сан-г fs-ээр уншина.
    "/pronunciation/**": ["./public/data/pinyin_chart.json", "./public/data/tone_pairs.json", "./data/hsk_words.json"],
  },
};

export default nextConfig;
