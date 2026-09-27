import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The /api/hanzi/[char] route reads stroke data from node_modules at
  // runtime; without tracing hints those files are missing on Vercel.
  outputFileTracingIncludes: {
    "/api/hanzi/[char]": ["./node_modules/hanzi-writer-data/**/*.json"],
    // «Уншлагын сан / 文库» — content/open/ доторх JSON-уудыг fs-ээр уншина.
    "/library": ["./content/open/**/*.json"],
    "/library/**": ["./content/open/**/*.json"],
    // «Бичих дэвтэр» — ханз таних API нь үгийн сан + ханзны толийг fs-ээр уншина.
    "/api/writing/**": ["./data/hsk_words.json", "./public/data/hsk_char_gloss.json"],
    // «Дуудлага / 发音» — пиньинь самбар, аялгуу хос, үгийн сан-г fs-ээр уншина.
    "/pronunciation/**": ["./public/data/pinyin_chart.json", "./public/data/tone_pairs.json", "./data/hsk_words.json"],
  },
};

export default nextConfig;
