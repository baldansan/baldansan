export type ZahialgaCountryId = "cn" | "kr" | "us";

export type ZahialgaCountry = {
  id: ZahialgaCountryId;
  flag: string;
  label: string;
  subtitle?: string;
  disabled: boolean;
  panelNote?: string;
};

export type ZahialgaFact = {
  value: string;
  label: string;
};

export type ZahialgaTermRow = {
  hanzi: string;
  pinyin: string;
  meaningMn: string;
};

export type ZahialgaLessonContent =
  | {
      kind: "taobao-intro";
      introParagraph: string;
      facts: ZahialgaFact[];
      sectionTitle: string;
      sectionParagraph: string;
    }
  | {
      kind: "app-register";
      intro: string;
      tip: string;
      termsTitle: string;
      terms: ZahialgaTermRow[];
    };

export type ZahialgaLesson = {
  number: number;
  title: string;
  subtitle: string;
  locked: boolean;
  defaultOpen?: boolean;
  lockIcon?: string;
  content?: ZahialgaLessonContent;
};
