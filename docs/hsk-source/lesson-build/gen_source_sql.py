"""python3 gen_source_sql.py hsk1  → repo content/hsk-source/hsk1/*.json + supabase/content/00N_hsk1_source_lessons.sql"""
import json,glob,os,sys,shutil
level=sys.argv[1]; num=sys.argv[2] if len(sys.argv)>2 else None
src=f"/home/claude/hskbuild/{level}" if level!="hsk3" else "/home/claude/hsk3build"
dst=f"/home/claude/repo/content/hsk-source/{level}"; os.makedirs(dst,exist_ok=True)
files=sorted(glob.glob(f"{src}/L*/source.json"))
for f in files:
    d=json.load(open(f)); shutil.copy(f, f"{dst}/{level}-l{d['lesson']:02d}.json")
def q(s): return "'"+str(s).replace("'","''")+"'" if s is not None else "null"
out=[f"-- {level.upper()} эх сурвалжийн сан — {len(files)} хичээл (content/hsk-source/{level}/*.json). Дахин ажиллуулахад аюулгүй (upsert).","begin;"]
for f in sorted(glob.glob(f"{dst}/*.json")):
    d=json.load(open(f)); lid=f"{d['level']}-l{d['lesson']:02d}"; js=json.dumps(d,ensure_ascii=False).replace("'","''")
    out.append(f"insert into public.hsk_source_lessons (id, level, book, lesson, title_zh, title_pinyin, title_en, payload, schema_version, status)\nvalues ({q(lid)}, {q(d['level'])}, {q(d['book'])}, {d['lesson']}, {q(d['title_zh'])}, {q(d.get('title_pinyin'))}, {q(d.get('title_en'))}, '{js}'::jsonb, 1, 'image_verified')\non conflict (id) do update set book=excluded.book, title_zh=excluded.title_zh, title_pinyin=excluded.title_pinyin, title_en=excluded.title_en, payload=excluded.payload, schema_version=excluded.schema_version, status=excluded.status;")
out.append("commit;")
name=f"/home/claude/repo/supabase/content/{num or '00X'}_{level}_source_lessons.sql"
open(name,"w").write("\n".join(out)); print(name, os.path.getsize(name), len(files))
