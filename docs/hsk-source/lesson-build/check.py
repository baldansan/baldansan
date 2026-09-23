import json,re,sys
N=sys.argv[1]
t=json.load(open(f"L{N}/zip/texts.json")); w=json.load(open(f"L{N}/zip/workbook.json")); q=json.load(open(f"L{N}/zip/quiz.json")); v=json.load(open(f"L{N}/zip/vocabulary.json")); g=json.load(open(f"L{N}/zip/grammar.json")); l=json.load(open(f"L{N}/zip/lesson.json")); m=json.load(open(f"L{N}/zip/manifest.json"))
def strip(s): return re.sub(r"[\s，。？！：、“”…—]","",s)
for d in [t["mainText"]]+t["shortTexts"]:
    for s in d["sentences"]:
        tok="".join(x["zh"] for x in s["tokens"])
        if strip(tok)!=strip(s["zh"]): print("TOKEN MISMATCH", s["zh"], tok)
    print(" ", d["title"], d["audioFile"], len(d["sentences"]))
print("readAloud", t["textExercises"]["readAloud"].get("audioFile"))
print("listening", ["".join(i["answer"] for i in p["items"]) for p in w["listening"]["parts"]], [p["audio"] for p in w["listening"]["parts"]])
print("reading", ["".join(i["answer"] for i in p["items"]) for p in w["reading"]["parts"]])
print("writing n:", [i["n"] for i in w["writing"]["items"]])
print("review", [(i["n"], i.get("answer")) for i in w["review"]["items"]])
print("quiz", len(q), all(x["correct_answer"] in x["options"] for x in q), all("id" in x and "skillTags" in x and "difficulty" in x for x in q))
print("vocab", len(v), [x["chinese"] for x in v])
print("grammar", [x["point"] for x in g])
def has_tone(s): return bool(re.search(r"[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]", s))
print("no-tone vocab:", [x["pinyin"] for x in v if not has_tone(x["pinyin"])])
print("latin in mn:", re.findall(r'"mn": "[^"]*[A-Za-z]{3,}[^"]*"', open(f"L{N}/zip/texts.json").read())[:3])
print("lesson:", l["lessonId"], l["orderIndex"], l["title"], "|", l["description"])
print("manifest:", m["lessonId"], m["lessonNumber"], m["lessonProfile"], m["verification"])
import os; print("audio:", sorted(os.listdir(f"L{N}/zip/audio")))
