export type AnswerBlock = {
  w: string;
  role: string;
  label?: string;
};

export type ExamItem = {
  src?: string;
  words: string[];
  answer: AnswerBlock[];
  analysis: string;
};

export type HelzuiRoleColorDef = {
  label: string;
  color: string;
  isHeart?: boolean;
};

export type HelzuiRoleColors = Record<string, HelzuiRoleColorDef>;

export type HelzuiConceptRule = {
  text: string;
  eg?: string;
};

export type HelzuiPatternItem = {
  zh: string;
  mn: string;
};

export type HelzuiCollocationItem = {
  head: string;
  options: string;
};

export type HelzuiModule = {
  id: string;
  number: number;
  mnTitle: string;
  zh: string;
  pinyin: string;
  heading: string;
  teacher: string;
  concept: {
    title: string;
    rules: HelzuiConceptRule[];
  };
  patterns: {
    title: string;
    items: HelzuiPatternItem[];
  } | null;
  marker: string[];
  algorithm: string[];
  realExams: ExamItem[];
  practice: ExamItem[];
  collocations: HelzuiCollocationItem[];
};

export type HelzuiCourse = {
  courseId: string;
  category: string;
  title: string;
  subtitle: string;
  roleColors: HelzuiRoleColors;
  modules: HelzuiModule[];
};
