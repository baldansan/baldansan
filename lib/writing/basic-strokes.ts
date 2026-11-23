/**
 * Үндсэн 32 зурлага (基本笔画). hanzi-writer-data-д тусгай зурлагын тэмдэгт байхгүй тул
 * зурлага бүрийг жинхэнэ ханзны нэг зураасаас авна: `ch`-ийн `idx` дэх зураас (0-ээс).
 * Хос бүрийг зургаар шалгасан (2026-11-23).
 */
export type BasicStroke = {
  id: string;
  /** Хятад нэр */
  zh: string;
  pinyin: string;
  /** Монгол тайлбар */
  mn: string;
  ch: string;
  idx: number;
};

export const BASIC_STROKES: BasicStroke[] = [
  { id: "dian", zh: "点", pinyin: "diǎn", mn: "цэг", ch: "主", idx: 0 },
  { id: "heng", zh: "横", pinyin: "héng", mn: "хэвтээ", ch: "一", idx: 0 },
  { id: "shu", zh: "竖", pinyin: "shù", mn: "босоо", ch: "十", idx: 1 },
  { id: "pie", zh: "撇", pinyin: "piě", mn: "зүүн налуу", ch: "人", idx: 0 },
  { id: "na", zh: "捺", pinyin: "nà", mn: "баруун налуу", ch: "人", idx: 1 },
  { id: "ti", zh: "提", pinyin: "tí", mn: "өргөлт", ch: "地", idx: 2 },
  { id: "piedian", zh: "撇点", pinyin: "piědiǎn", mn: "налуу цэг", ch: "女", idx: 0 },
  { id: "shuti", zh: "竖提", pinyin: "shùtí", mn: "босоо өргөлт", ch: "长", idx: 2 },
  { id: "hengzheti", zh: "横折提", pinyin: "héngzhétí", mn: "хэвтээ нугалаас өргөлт", ch: "计", idx: 1 },
  { id: "wangou", zh: "弯钩", pinyin: "wāngōu", mn: "тахир дэгээ", ch: "子", idx: 1 },
  { id: "shugou", zh: "竖钩", pinyin: "shùgōu", mn: "босоо дэгээ", ch: "小", idx: 0 },
  { id: "shuwangou", zh: "竖弯钩", pinyin: "shùwāngōu", mn: "босоо тахир дэгээ", ch: "儿", idx: 1 },
  { id: "xiegou", zh: "斜钩", pinyin: "xiégōu", mn: "налуу дэгээ", ch: "戈", idx: 1 },
  { id: "hengzhewangou", zh: "横折弯钩", pinyin: "héngzhéwāngōu", mn: "хэвтээ нугалаас тахир дэгээ", ch: "九", idx: 1 },
  { id: "hengpiewangou", zh: "横撇弯钩", pinyin: "héngpiěwāngōu", mn: "хэвтээ налуу тахир дэгээ", ch: "队", idx: 0 },
  { id: "hengzhegou", zh: "横折钩", pinyin: "héngzhégōu", mn: "хэвтээ нугалаас дэгээ", ch: "月", idx: 1 },
  { id: "wogou", zh: "卧钩", pinyin: "wògōu", mn: "хэвтэй дэгээ", ch: "心", idx: 1 },
  { id: "henggou", zh: "横钩", pinyin: "hénggōu", mn: "хэвтээ дэгээ", ch: "买", idx: 0 },
  { id: "hengzhe", zh: "横折", pinyin: "héngzhé", mn: "хэвтээ нугалаас", ch: "口", idx: 1 },
  { id: "shuzhe", zh: "竖折", pinyin: "shùzhé", mn: "босоо нугалаас", ch: "山", idx: 1 },
  { id: "hengzhezhepie", zh: "横折折撇", pinyin: "héngzhézhépiě", mn: "хэвтээ хоёр нугалаас налуу", ch: "及", idx: 1 },
  { id: "shuzhezhegou", zh: "竖折折钩", pinyin: "shùzhézhégōu", mn: "босоо хоёр нугалаас дэгээ", ch: "马", idx: 1 },
  { id: "shuwan", zh: "竖弯", pinyin: "shùwān", mn: "босоо тахир", ch: "四", idx: 3 },
  { id: "hengzhewan", zh: "横折弯", pinyin: "héngzhéwān", mn: "хэвтээ нугалаас тахир", ch: "朵", idx: 1 },
  { id: "piezhe", zh: "撇折", pinyin: "piězhé", mn: "налуу нугалаас", ch: "么", idx: 1 },
  { id: "hengzhezhezhegou", zh: "横折折折钩", pinyin: "héngzhézhézhégōu", mn: "хэвтээ гурван нугалаас дэгээ", ch: "乃", idx: 0 },
  { id: "hengpie", zh: "横撇", pinyin: "héngpiě", mn: "хэвтээ налуу", ch: "又", idx: 0 },
  { id: "hengxiegou", zh: "横斜钩", pinyin: "héngxiégōu", mn: "хэвтээ налуу дэгээ", ch: "飞", idx: 0 },
  { id: "shuzhepie", zh: "竖折撇", pinyin: "shùzhépiě", mn: "босоо нугалаас налуу", ch: "专", idx: 2 },
  { id: "shuzhezhe", zh: "竖折折", pinyin: "shùzhézhé", mn: "босоо хоёр нугалаас", ch: "鼎", idx: 5 },
  { id: "hengzhezhe", zh: "横折折", pinyin: "héngzhézhé", mn: "хэвтээ хоёр нугалаас", ch: "凹", idx: 1 },
  { id: "hengzhezhezhe", zh: "横折折折", pinyin: "héngzhézhézhé", mn: "хэвтээ гурван нугалаас", ch: "凸", idx: 3 },
];
