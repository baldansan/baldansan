/**
 * One-off generator: node supabase/seed/_generate-seed.mjs
 * Not part of the app; data mirrors content/courses/hsk5/lessons/lesson-{1,2,3}.ts
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const course = {
  id: "hsk5",
  title: "HSK5 Short Drama Chinese",
  description:
    "Илүү гүнзгий хэллэг, subtitle, shadowing, quiz-тэй хичээлүүд.",
  level: "HSK5",
  status: "available",
  order_index: 1,
};

const lessons = [
  {
    id: "1",
    course_id: "hsk5",
    title: "Lesson 1",
    chinese_title: "爱的细节",
    subtitle:
      "Хайрын жижиг деталь, халамж, ойлголцлын тухай богино хичээл.",
    description:
      "Хайрын жижиг деталь, халамж, ойлголцлын тухай богино хичээл.",
    duration: "8 min",
    vocabulary_count: 5,
    quiz_count: 5,
    status: "available",
    order_index: 1,
    timedSubtitles: [
      {
        start: "00:00",
        end: "00:03",
        chinese: "你真的懂我吗？",
        pinyin: "Nǐ zhēn de dǒng wǒ ma?",
        mongolian: "Чи намайг үнэхээр ойлгодог уу?",
      },
      {
        start: "00:04",
        end: "00:07",
        chinese: "我只是想照顾你。",
        pinyin: "Wǒ zhǐshì xiǎng zhàogù nǐ.",
        mongolian: "Би зүгээр л чамайг халамжлахыг хүссэн.",
      },
      {
        start: "00:08",
        end: "00:11",
        chinese: "可是你从来不听我的感受。",
        pinyin: "Kěshì nǐ cónglái bù tīng wǒ de gǎnshòu.",
        mongolian: "Гэхдээ чи миний мэдрэмжийг хэзээ ч сонсдоггүй.",
      },
      {
        start: "00:12",
        end: "00:15",
        chinese: "我以为这就是爱。",
        pinyin: "Wǒ yǐwéi zhè jiùshì ài.",
        mongolian: "Би үүнийг л хайр гэж бодсон.",
      },
    ],
    vocabulary: [
      {
        chinese: "细节",
        pinyin: "xìjié",
        mongolian: "нарийн зүйл, жижиг деталь",
        hsk_level: "HSK5",
        example_chinese: "爱的细节很重要。",
        example_mongolian: "Хайрын жижиг зүйлс маш чухал.",
      },
      {
        chinese: "照顾",
        pinyin: "zhàogù",
        mongolian: "асрах, халамжлах",
        hsk_level: "HSK4",
        example_chinese: "他很会照顾别人。",
        example_mongolian: "Тэр бусдыг халамжлахдаа сайн.",
      },
      {
        chinese: "理解",
        pinyin: "lǐjiě",
        mongolian: "ойлгох",
        hsk_level: "HSK4",
        example_chinese: "我希望你能理解我。",
        example_mongolian: "Чи намайг ойлгоосой гэж би хүсэж байна.",
      },
      {
        chinese: "感受",
        pinyin: "gǎnshòu",
        mongolian: "мэдрэмж",
        hsk_level: "HSK5",
        example_chinese: "你从来不听我的感受。",
        example_mongolian: "Чи миний мэдрэмжийг хэзээ ч сонсдоггүй.",
      },
      {
        chinese: "以为",
        pinyin: "yǐwéi",
        mongolian: "гэж бодох, андуурах",
        hsk_level: "HSK4",
        example_chinese: "我以为这就是爱。",
        example_mongolian: "Би үүнийг л хайр гэж бодсон.",
      },
    ],
    quizQuestions: [
      {
        type: "multiple_choice",
        question: "“细节” гэдэг үгийн зөв утга аль вэ?",
        options: [
          "нарийн зүйл, жижиг деталь",
          "хурдан явах",
          "маргааш уулзах",
          "хоол хийх",
        ],
        correct_answer: "нарийн зүйл, жижиг деталь",
        explanation:
          "“细节” нь detail буюу жижиг нарийн зүйл гэсэн утгатай.",
      },
      {
        type: "multiple_choice",
        question: "“照顾” гэдэг үгийн зөв утга аль вэ?",
        options: ["асрах, халамжлах", "сонгох", "худалдаж авах", "явуулах"],
        correct_answer: "асрах, халамжлах",
        explanation: "“照顾” нь care for, look after гэсэн утгатай.",
      },
      {
        type: "cloze",
        question: "我只是想____你。",
        options: ["照顾", "细节", "感受", "以为"],
        correct_answer: "照顾",
        explanation:
          "“我只是想照顾你。” = Би зүгээр л чамайг халамжлахыг хүссэн.",
      },
      {
        type: "multiple_choice",
        question: "“感受” гэдэг үгийн зөв утга аль вэ?",
        options: ["мэдрэмж", "үнэ", "хаяг", "зам"],
        correct_answer: "мэдрэмж",
        explanation: "“感受” нь feeling, sensation гэсэн утгатай.",
      },
      {
        type: "cloze",
        question: "我____这就是爱。",
        options: ["以为", "理解", "照顾", "细节"],
        correct_answer: "以为",
        explanation: "“我以为这就是爱。” = Би үүнийг л хайр гэж бодсон.",
      },
    ],
  },
  {
    id: "2",
    course_id: "hsk5",
    title: "Lesson 2",
    chinese_title: "你真的懂我吗？",
    subtitle: "Харилцаанд ойлголцол, асуулт, сэтгэл хөдлөлийн хэллэгүүд.",
    description:
      "Энэ хичээлээр харилцаанд хэрэглэгддэг асуулт, ойлголцол, мэдрэмж, тайлбарлах хэллэгүүдийг сурна.",
    duration: "7 min",
    vocabulary_count: 12,
    quiz_count: 5,
    status: "available",
    order_index: 2,
    timedSubtitles: [
      {
        start: "00:00",
        end: "00:03",
        chinese: "你真的懂我吗？",
        pinyin: "Nǐ zhēn de dǒng wǒ ma?",
        mongolian: "Чи намайг үнэхээр ойлгодог уу?",
      },
      {
        start: "00:04",
        end: "00:07",
        chinese: "我不是不在乎你。",
        pinyin: "Wǒ bú shì bù zàihū nǐ.",
        mongolian: "Би чамайг тоодоггүй гэсэн үг биш.",
      },
      {
        start: "00:08",
        end: "00:11",
        chinese: "只是有时候我不知道该怎么说。",
        pinyin: "Zhǐshì yǒu shíhou wǒ bù zhīdào gāi zěnme shuō.",
        mongolian: "Зүгээр л заримдаа би юу гэж хэлэхээ мэддэггүй.",
      },
      {
        start: "00:12",
        end: "00:15",
        chinese: "那你可以告诉我你的感受。",
        pinyin: "Nà nǐ kěyǐ gàosu wǒ nǐ de gǎnshòu.",
        mongolian: "Тэгвэл чи надад мэдрэмжээ хэлж болно шүү дээ.",
      },
      {
        start: "00:16",
        end: "00:19",
        chinese: "我怕说出来会让你难过。",
        pinyin: "Wǒ pà shuō chūlái huì ràng nǐ nánguò.",
        mongolian: "Хэлчихвэл чамайг гомдоочих вий гэж айсан.",
      },
      {
        start: "00:20",
        end: "00:23",
        chinese: "不说出来，我才更难过。",
        pinyin: "Bù shuō chūlái, wǒ cái gèng nánguò.",
        mongolian: "Хэлэхгүй байх чинь харин намайг илүү гомдоодог.",
      },
    ],
    vocabulary: [
      {
        chinese: "懂",
        pinyin: "dǒng",
        mongolian: "ойлгох",
        hsk_level: "HSK3",
        example_chinese: "你真的懂我吗？",
        example_mongolian: "Чи намайг үнэхээр ойлгодог уу?",
      },
      {
        chinese: "在乎",
        pinyin: "zàihū",
        mongolian: "тоох, санаа тавих",
        hsk_level: "HSK5",
        example_chinese: "我不是不在乎你。",
        example_mongolian: "Би чамайг тоодоггүй гэсэн үг биш.",
      },
      {
        chinese: "有时候",
        pinyin: "yǒu shíhou",
        mongolian: "заримдаа",
        hsk_level: "HSK3",
        example_chinese: "有时候我不知道该怎么说。",
        example_mongolian: "Заримдаа би юу гэж хэлэхээ мэддэггүй.",
      },
      {
        chinese: "该",
        pinyin: "gāi",
        mongolian: "ёстой, хэрэгтэй",
        hsk_level: "HSK4",
        example_chinese: "我不知道该怎么说。",
        example_mongolian: "Би яаж хэлэх ёстойгоо мэдэхгүй байна.",
      },
      {
        chinese: "告诉",
        pinyin: "gàosu",
        mongolian: "хэлэх, мэдэгдэх",
        hsk_level: "HSK3",
        example_chinese: "你可以告诉我你的感受。",
        example_mongolian: "Чи надад мэдрэмжээ хэлж болно.",
      },
      {
        chinese: "感受",
        pinyin: "gǎnshòu",
        mongolian: "мэдрэмж",
        hsk_level: "HSK5",
        example_chinese: "告诉我你的感受。",
        example_mongolian: "Надад мэдрэмжээ хэл.",
      },
      {
        chinese: "怕",
        pinyin: "pà",
        mongolian: "айх",
        hsk_level: "HSK3",
        example_chinese: "我怕说出来会让你难过。",
        example_mongolian: "Хэлчихвэл чамайг гомдоочих вий гэж айсан.",
      },
      {
        chinese: "说出来",
        pinyin: "shuō chūlái",
        mongolian: "ам нээж хэлэх, ил хэлэх",
        hsk_level: "HSK4",
        example_chinese: "不说出来，我才更难过。",
        example_mongolian: "Хэлэхгүй байх чинь харин намайг илүү гомдоодог.",
      },
      {
        chinese: "让",
        pinyin: "ràng",
        mongolian: "хэн нэгнийг ямар нэг байдалд хүргэх",
        hsk_level: "HSK4",
        example_chinese: "会让你难过。",
        example_mongolian: "Чамайг гомдоох болно.",
      },
      {
        chinese: "难过",
        pinyin: "nánguò",
        mongolian: "гуниглах, сэтгэл өвдөх, гомдох",
        hsk_level: "HSK4",
        example_chinese: "我才更难过。",
        example_mongolian: "Би харин илүү гомдоно.",
      },
      {
        chinese: "才",
        pinyin: "cái",
        mongolian: "харин, сая, л",
        hsk_level: "HSK4",
        example_chinese: "我才更难过。",
        example_mongolian: "Би харин илүү гомдоно.",
      },
      {
        chinese: "更",
        pinyin: "gèng",
        mongolian: "илүү",
        hsk_level: "HSK3",
        example_chinese: "我才更难过。",
        example_mongolian: "Би харин илүү их гомдоно.",
      },
    ],
    quizQuestions: [
      {
        type: "multiple_choice",
        question: "“在乎” гэдэг үгийн зөв утга аль вэ?",
        options: [
          "тоох, санаа тавих",
          "хаалга нээх",
          "хоол хийх",
          "маргааш явах",
        ],
        correct_answer: "тоох, санаа тавих",
        explanation:
          "“在乎” нь care about буюу тоох, санаа тавих гэсэн утгатай.",
      },
      {
        type: "multiple_choice",
        question: "“难过” гэдэг үгийн зөв утга аль вэ?",
        options: [
          "гуниглах, гомдох",
          "баярлах",
          "худалдаж авах",
          "хурдан гүйх",
        ],
        correct_answer: "гуниглах, гомдох",
        explanation: "“难过” нь sad, upset гэсэн утгатай.",
      },
      {
        type: "cloze",
        question: "我不是不____你。",
        options: ["在乎", "难过", "告诉", "更"],
        correct_answer: "在乎",
        explanation: "“我不是不在乎你。” = Би чамайг тоодоггүй гэсэн үг биш.",
      },
      {
        type: "cloze",
        question: "你可以____我你的感受。",
        options: ["告诉", "怕", "懂", "才"],
        correct_answer: "告诉",
        explanation: "“你可以告诉我你的感受。” = Чи надад мэдрэмжээ хэлж болно.",
      },
      {
        type: "multiple_choice",
        question:
          "“我怕说出来会让你难过。” өгүүлбэрийн хамгийн зөв Монгол утга аль вэ?",
        options: [
          "Хэлчихвэл чамайг гомдоочих вий гэж айсан.",
          "Би одоо хоол хийж байна.",
          "Чи маргааш ирэх үү?",
          "Энэ үнэ хэтэрхий өндөр байна.",
        ],
        correct_answer: "Хэлчихвэл чамайг гомдоочих вий гэж айсан.",
        explanation:
          "Энэ өгүүлбэрт “怕” = айх, “说出来” = ил хэлэх, “难过” = гомдох гэсэн утгатай.",
      },
    ],
  },
  {
    id: "3",
    course_id: "hsk5",
    title: "Lesson 3",
    chinese_title: "我只是想照顾你",
    subtitle: "Халамжлах, санаа тавих, тайлбарлах үед хэрэглэгдэх өгүүлбэрүүд.",
    description:
      "Энэ хичээлээр халамжлах, санаа тавих, буруу ойлголцлоо тайлбарлах үед хэрэглэгдэх бодит хэллэгүүдийг сурна.",
    duration: "9 min",
    vocabulary_count: 12,
    quiz_count: 5,
    status: "available",
    order_index: 3,
    timedSubtitles: [
      {
        start: "00:00",
        end: "00:03",
        chinese: "我只是想照顾你。",
        pinyin: "Wǒ zhǐshì xiǎng zhàogù nǐ.",
        mongolian: "Би зүгээр л чамайг халамжлахыг хүссэн.",
      },
      {
        start: "00:04",
        end: "00:07",
        chinese: "可是你从来没有问过我想要什么。",
        pinyin: "Kěshì nǐ cónglái méiyǒu wèn guò wǒ xiǎng yào shénme.",
        mongolian:
          "Гэхдээ чи надаас юу хүсэж байгааг минь хэзээ ч асууж байгаагүй.",
      },
      {
        start: "00:08",
        end: "00:11",
        chinese: "我以为你会喜欢。",
        pinyin: "Wǒ yǐwéi nǐ huì xǐhuan.",
        mongolian: "Чамд таалагдана гэж би бодсон.",
      },
      {
        start: "00:12",
        end: "00:15",
        chinese: "你以为的，不一定是我需要的。",
        pinyin: "Nǐ yǐwéi de, bù yídìng shì wǒ xūyào de.",
        mongolian: "Чиний бодсон зүйл заавал надад хэрэгтэй зүйл биш.",
      },
      {
        start: "00:16",
        end: "00:19",
        chinese: "那我以后会先问你。",
        pinyin: "Nà wǒ yǐhòu huì xiān wèn nǐ.",
        mongolian: "Тэгвэл би дараа нь эхлээд чамаас асууж байя.",
      },
      {
        start: "00:20",
        end: "00:23",
        chinese: "我需要的不是安排，而是尊重。",
        pinyin: "Wǒ xūyào de bú shì ānpái, ér shì zūnzhòng.",
        mongolian: "Надад хэрэгтэй зүйл бол зохицуулалт биш, харин хүндлэл.",
      },
    ],
    vocabulary: [
      {
        chinese: "只是",
        pinyin: "zhǐshì",
        mongolian: "зүгээр л, зөвхөн",
        hsk_level: "HSK4",
        example_chinese: "我只是想照顾你。",
        example_mongolian: "Би зүгээр л чамайг халамжлахыг хүссэн.",
      },
      {
        chinese: "照顾",
        pinyin: "zhàogù",
        mongolian: "асрах, халамжлах",
        hsk_level: "HSK4",
        example_chinese: "我只是想照顾你。",
        example_mongolian: "Би зүгээр л чамайг халамжлахыг хүссэн.",
      },
      {
        chinese: "从来",
        pinyin: "cónglái",
        mongolian: "ерөөсөө, хэзээ ч",
        hsk_level: "HSK5",
        example_chinese: "你从来没有问过我。",
        example_mongolian: "Чи надаас хэзээ ч асууж байгаагүй.",
      },
      {
        chinese: "问过",
        pinyin: "wèn guò",
        mongolian: "асууж байсан",
        hsk_level: "HSK4",
        example_chinese: "你没有问过我想要什么。",
        example_mongolian: "Чи миний юу хүсэж байгааг асууж байгаагүй.",
      },
      {
        chinese: "以为",
        pinyin: "yǐwéi",
        mongolian: "гэж бодох, андуурах",
        hsk_level: "HSK4",
        example_chinese: "我以为你会喜欢。",
        example_mongolian: "Чамд таалагдана гэж би бодсон.",
      },
      {
        chinese: "不一定",
        pinyin: "bù yídìng",
        mongolian: "заавал тийм биш",
        hsk_level: "HSK4",
        example_chinese: "不一定是我需要的。",
        example_mongolian: "Заавал миний хэрэгтэй зүйл биш.",
      },
      {
        chinese: "需要",
        pinyin: "xūyào",
        mongolian: "хэрэгтэй байх, хэрэгцээтэй",
        hsk_level: "HSK3",
        example_chinese: "我需要的是尊重。",
        example_mongolian: "Надад хэрэгтэй зүйл бол хүндлэл.",
      },
      {
        chinese: "以后",
        pinyin: "yǐhòu",
        mongolian: "цаашдаа, дараа нь",
        hsk_level: "HSK3",
        example_chinese: "我以后会先问你。",
        example_mongolian: "Би цаашдаа эхлээд чамаас асууна.",
      },
      {
        chinese: "先",
        pinyin: "xiān",
        mongolian: "эхлээд, түрүүлж",
        hsk_level: "HSK3",
        example_chinese: "我会先问你。",
        example_mongolian: "Би эхлээд чамаас асууна.",
      },
      {
        chinese: "安排",
        pinyin: "ānpái",
        mongolian: "зохицуулалт, төлөвлөх",
        hsk_level: "HSK4",
        example_chinese: "我需要的不是安排。",
        example_mongolian: "Надад хэрэгтэй зүйл зохицуулалт биш.",
      },
      {
        chinese: "而是",
        pinyin: "ér shì",
        mongolian: "харин, харин бол",
        hsk_level: "HSK5",
        example_chinese: "不是安排，而是尊重。",
        example_mongolian: "Зохицуулалт биш, харин хүндлэл.",
      },
      {
        chinese: "尊重",
        pinyin: "zūnzhòng",
        mongolian: "хүндлэх, хүндлэл",
        hsk_level: "HSK5",
        example_chinese: "我需要的是尊重。",
        example_mongolian: "Надад хэрэгтэй зүйл бол хүндлэл.",
      },
    ],
    quizQuestions: [
      {
        type: "multiple_choice",
        question: "“照顾” гэдэг үгийн зөв утга аль вэ?",
        options: ["асрах, халамжлах", "худалдаж авах", "явуулах", "мартах"],
        correct_answer: "асрах, халамжлах",
        explanation:
          "“照顾” нь care for, look after буюу асрах, халамжлах гэсэн утгатай.",
      },
      {
        type: "multiple_choice",
        question: "“尊重” гэдэг үгийн зөв утга аль вэ?",
        options: ["хүндлэх, хүндлэл", "инээх", "асуух", "яарах"],
        correct_answer: "хүндлэх, хүндлэл",
        explanation: "“尊重” нь respect буюу хүндлэл гэсэн утгатай.",
      },
      {
        type: "cloze",
        question: "我只是想____你。",
        options: ["照顾", "安排", "尊重", "从来"],
        correct_answer: "照顾",
        explanation:
          "“我只是想照顾你。” = Би зүгээр л чамайг халамжлахыг хүссэн.",
      },
      {
        type: "cloze",
        question: "你____的，不一定是我需要的。",
        options: ["以为", "以后", "先", "只是"],
        correct_answer: "以为",
        explanation:
          "“你以为的，不一定是我需要的。” = Чиний бодсон зүйл заавал надад хэрэгтэй зүйл биш.",
      },
      {
        type: "multiple_choice",
        question:
          "“我需要的不是安排，而是尊重。” өгүүлбэрийн хамгийн зөв Монгол утга аль вэ?",
        options: [
          "Надад хэрэгтэй зүйл бол зохицуулалт биш, харин хүндлэл.",
          "Би маргааш чамтай уулзана.",
          "Энэ хоол маш амттай байна.",
          "Чи надаас хэзээ ч асуугаагүй.",
        ],
        correct_answer:
          "Надад хэрэгтэй зүйл бол зохицуулалт биш, харин хүндлэл.",
        explanation:
          "“不是……而是……” бүтэц нь “... биш, харин ...” гэсэн утгатай.",
      },
    ],
  },
];

function esc(s) {
  if (s == null) return "null";
  return `'${String(s).replace(/'/g, "''")}'`;
}

function sqlVal(v) {
  if (v == null) return "null";
  return esc(v);
}

const lines = [];
lines.push(`-- Buunduu Surtsgaay — seed HSK5 Lessons 1–3 (Phase 3 Step 3)`);
lines.push(`-- Source: content/courses/hsk5/lessons/lesson-{1,2,3}.ts`);
lines.push(`-- Prerequisite: supabase/migrations/001_initial_schema.sql`);
lines.push(`-- Idempotent: upsert course/lessons; replace child rows for lessons 1–3`);
lines.push(`-- Does not modify user_* progress tables`);
lines.push(``);
lines.push(`begin;`);
lines.push(``);

// Course
lines.push(`-- Course: hsk5`);
lines.push(
  `insert into public.courses (id, title, description, level, status, order_index)`,
);
lines.push(`values (`);
lines.push(
  `  ${esc(course.id)}, ${esc(course.title)}, ${esc(course.description)}, ${esc(course.level)}, ${esc(course.status)}, ${course.order_index}`,
);
lines.push(`)`);
lines.push(`on conflict (id) do update set`);
lines.push(`  title = excluded.title,`);
lines.push(`  description = excluded.description,`);
lines.push(`  level = excluded.level,`);
lines.push(`  status = excluded.status,`);
lines.push(`  order_index = excluded.order_index,`);
lines.push(`  updated_at = now();`);
lines.push(``);

// Lessons
for (const l of lessons) {
  lines.push(`-- Lesson ${l.id}`);
  lines.push(
    `insert into public.lessons (id, course_id, title, chinese_title, subtitle, description, duration, vocabulary_count, quiz_count, status, order_index)`,
  );
  lines.push(`values (`);
  lines.push(
    `  ${esc(l.id)}, ${esc(l.course_id)}, ${esc(l.title)}, ${esc(l.chinese_title)}, ${esc(l.subtitle)}, ${esc(l.description)}, ${esc(l.duration)}, ${l.vocabulary_count}, ${l.quiz_count}, ${esc(l.status)}, ${l.order_index}`,
  );
  lines.push(`)`);
  lines.push(`on conflict (id) do update set`);
  lines.push(`  course_id = excluded.course_id,`);
  lines.push(`  title = excluded.title,`);
  lines.push(`  chinese_title = excluded.chinese_title,`);
  lines.push(`  subtitle = excluded.subtitle,`);
  lines.push(`  description = excluded.description,`);
  lines.push(`  duration = excluded.duration,`);
  lines.push(`  vocabulary_count = excluded.vocabulary_count,`);
  lines.push(`  quiz_count = excluded.quiz_count,`);
  lines.push(`  status = excluded.status,`);
  lines.push(`  order_index = excluded.order_index,`);
  lines.push(`  updated_at = now();`);
  lines.push(``);
}

lines.push(`-- Remove existing child rows for lessons 1–3 (re-seed safe)`);
lines.push(
  `delete from public.subtitle_lines where lesson_id in ('1', '2', '3');`,
);
lines.push(
  `delete from public.vocabulary_words where lesson_id in ('1', '2', '3');`,
);
lines.push(
  `delete from public.quiz_questions where lesson_id in ('1', '2', '3');`,
);
lines.push(``);

let subCount = 0;
let vocabCount = 0;
let quizCount = 0;

for (const l of lessons) {
  lines.push(`-- Subtitles: lesson ${l.id}`);
  l.timedSubtitles.forEach((s, i) => {
    subCount++;
    lines.push(
      `insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values (${esc(l.id)}, ${esc(s.start)}, ${esc(s.end)}, ${esc(s.chinese)}, ${sqlVal(s.pinyin)}, ${esc(s.mongolian)}, ${i + 1});`,
    );
  });
  lines.push(``);

  lines.push(`-- Vocabulary: lesson ${l.id}`);
  l.vocabulary.forEach((v, i) => {
    vocabCount++;
    lines.push(
      `insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values (${esc(l.id)}, ${esc(v.chinese)}, ${sqlVal(v.pinyin)}, ${esc(v.mongolian)}, ${esc(v.hsk_level)}, ${esc(v.example_chinese)}, ${esc(v.example_mongolian)}, ${i + 1});`,
    );
  });
  lines.push(``);

  lines.push(`-- Quiz: lesson ${l.id}`);
  l.quizQuestions.forEach((q, i) => {
    quizCount++;
    const opts = JSON.stringify(q.options);
    lines.push(
      `insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values (${esc(l.id)}, ${esc(q.type)}, ${esc(q.question)}, '${opts.replace(/'/g, "''")}'::jsonb, ${esc(q.correct_answer)}, ${esc(q.explanation)}, ${i + 1});`,
    );
  });
  lines.push(``);
}

lines.push(`commit;`);
lines.push(``);
lines.push(`-- Expected row counts after seed:`);
lines.push(`-- courses: 1`);
lines.push(`-- lessons: 3`);
lines.push(`-- subtitle_lines: ${subCount} (lesson 1: 4, lesson 2: 6, lesson 3: 6)`);
lines.push(`-- vocabulary_words: ${vocabCount} (lesson 1: 5, lesson 2: 12, lesson 3: 12)`);
lines.push(`-- quiz_questions: ${quizCount} (5 per lesson)`);

const outPath = join(__dirname, "001_seed_hsk5_lessons.sql");
writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`subtitle_lines: ${subCount}, vocabulary_words: ${vocabCount}, quiz_questions: ${quizCount}`);
