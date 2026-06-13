export type Hsk30Example = {
  c: string;
  p: string;
  m: string;
};

export type Hsk30Mistake = {
  wrong: string;
  right: string;
  why: string;
};

export type Hsk30QuizItem = {
  id: string;
  type: "choice" | "judge";
  q: string;
  opts: string[];
  a: number;
  ok?: string;
  no?: string;
};

export type Hsk30Point = {
  id: string;
  zh: string;
  pin: string;
  gloss: string;
  teacher: string;
  structure: string;
  examples: Hsk30Example[];
  notes?: string;
  mistakes?: Hsk30Mistake[];
  exercises?: Hsk30QuizItem[];
  check?: Hsk30QuizItem;
};

export type Hsk30Level = {
  level: number;
  levelId: string;
  title: string;
  pointCount: number;
  points: Hsk30Point[];
};

export type Hsk30DuremCourse = {
  courseId: string;
  category: string;
  title: string;
  subtitle: string;
  source?: string;
  levels: Hsk30Level[];
};
