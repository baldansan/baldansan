import json,sys,os,shutil,re
tpl=open('L20/INSTRUCTIONS-HSK6-L20.md',encoding='utf-8').read()
src20=json.load(open('/home/claude/baldansan/content/hsk-source/hsk6/hsk6-l20.json',encoding='utf-8'))
def info(s):
    tb=s['textbook']; t=tb['texts'][0]
    return dict(title=s['title_zh'],py=s['title_pinyin'],en=s['title_en'],
      nlines=len(t['lines']),nwords=len(t['new_words']),
      gp=' / '.join(g['title_zh'] for g in tb['grammar']),
      ex=', '.join(f"{e['n']} {e['type_zh']}" for e in tb['exercises']),
      wb=str([(sec['n'],len(sec['items'])) for sec in s['workbook']['sections']]),
      unc=(' '.join(s['unclear'])[:150]+'…'))
a=info(src20)
for NN in sys.argv[1:]:
    s=json.load(open(f'/home/claude/baldansan/content/hsk-source/hsk6/hsk6-l{NN}.json',encoding='utf-8'))
    b=info(s); out=tpl
    for k in a:
        if isinstance(a[k],str) and a[k] and a[k] in out: out=out.replace(a[k],b[k])
    out=out.replace('第20课',f'第{int(NN)}课').replace('L20',f'L{NN}').replace('l20',f'l{NN}').replace('hsk6-l20',f'hsk6-l{NN}')
    out=out.replace('lessonNumber 20',f'lessonNumber {int(NN)}').replace('orderIndex 20',f'orderIndex {int(NN)}')
    out=out.replace(f'{a["nlines"]} өгүүлбэр',f'{b["nlines"]} өгүүлбэр').replace(f'new_words ~{a["nwords"]}',f'new_words ~{b["nwords"]}')
    out=out.replace(f'/home/claude/hsk3build/L{NN}/INSTRUCTIONS-L01.md','/home/claude/hsk3build/L01/INSTRUCTIONS-L01.md')
    os.makedirs(f'L{NN}/zip',exist_ok=True)
    open(f'L{NN}/INSTRUCTIONS-HSK6-L{NN}.md','w',encoding='utf-8').write(out)
    shutil.copy('L20/mongolian_language.md',f'L{NN}/mongolian_language.md')
    print(NN,b['title'],b['gp'],b['nlines'],b['nwords'],b['wb'])
