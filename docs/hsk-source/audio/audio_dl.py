import re,html,subprocess,os,sys,json,time
SERIES={
 "hsk1-textbook":"c55419ff-dd4c-4ead-9dae-0d159197f622","hsk1-workbook":"4c545205-cd03-4496-9576-7ad165099c7c",
 "hsk2-textbook":"d47a93c3-ae70-43f6-9e32-140b2a473d53","hsk2-workbook":"899d602d-177e-4fb9-bc7f-c7f13b8b6519",
 "hsk3-textbook":"1cd84d66-f817-40a4-bfaf-2d58b02ebe3a","hsk3-workbook":"040d3754-5e4e-4e75-8640-be9b29289493",
 "hsk4a-textbook":"009861d5-008b-495d-ae7a-23482ec05ad7","hsk4a-workbook":"1136db02-d271-4287-9843-0daab9a5f9e6",
 "hsk4b-textbook":"3ddee33f-4951-4075-8698-18b1ef0190e0","hsk4b-workbook":"d5a5a8be-a01b-4490-9281-cf812cba67b5",
 "hsk5a-textbook":"f1a99c5e-b11a-418e-8931-225d65a9eecf","hsk5a-workbook":"f0ddbb9f-4994-4f25-8a95-ef93a3eb4f87",
 "hsk5b-textbook":"e26ee8ac-f5b4-46c2-a559-878a7bf9d8b5","hsk5b-workbook":"0bc32706-d86f-419e-abf1-dcc107a1a35a",
 "hsk6a-textbook":"9c4d9b7f-5cf5-4f5c-bc29-7b4b89feaec1","hsk6a-workbook":"bc0edc0e-7450-4d80-8e7f-fe6c955e2902",
 "hsk6b-textbook":"bc301459-7c99-47d1-90ea-6ccdfaf6ee06",
}
ROOT="/home/claude/hskaudio"
def get(u,tries=4):
    for i in range(tries):
        r=subprocess.run(["curl","-sS","-L","--max-time","60",u],capture_output=True,text=True,errors="ignore")
        if r.returncode==0 and r.stdout: return r.stdout
        time.sleep(3)
    return ""
def safe(t): return re.sub(r'[\\/:*?"<>|\s]+','_',t).strip('_')
order=sys.argv[1:] or list(SERIES)
for name in order:
    rid=SERIES[name]; d=f"{ROOT}/{name}"; os.makedirs(d,exist_ok=True)
    s=get(f"https://www.blcup.com/MobileResSeries?rid={rid}")
    items=[]
    for m in re.finditer(r'href="/MobileResource\?rid=([^"]+)"[^>]*>(.*?)</a>',s,re.S):
        t=re.sub(r'<[^>]+>|\s+',' ',html.unescape(m.group(2))).strip()
        if t and (m.group(1),t) not in items: items.append((m.group(1),t))
    manifest=[]
    print(name,len(items),flush=True)
    for i,(r,t) in enumerate(items):
        fn=f"{d}/{i+1:03d}_{safe(t)}.mp3"
        if os.path.exists(fn) and os.path.getsize(fn)>1000: manifest.append((t,os.path.basename(fn),"cached")); continue
        v=get(f"https://www.blcup.com/MobileResource/ViewRes?rid={r}")
        m=re.search(r'src="(/File/[^"]+\.(?:mp3|m4a|wav))"',v)
        if not m: print("  NOFILE",t,flush=True); manifest.append((t,None,"nofile")); continue
        url="https://www.blcup.com"+m.group(1)
        ok=False
        for k in range(3):
            rr=subprocess.run(["curl","-sS","-L","--max-time","300","-o",fn,url],capture_output=True)
            if rr.returncode==0 and os.path.getsize(fn)>1000: ok=True; break
            time.sleep(5)
        print("  ",("ok" if ok else "FAIL"),t,os.path.getsize(fn) if os.path.exists(fn) else 0,flush=True)
        manifest.append((t,os.path.basename(fn),m.group(1) if ok else "fail"))
    json.dump(manifest,open(f"{d}/manifest.json","w"),ensure_ascii=False,indent=1)
print("ALLDONE")
