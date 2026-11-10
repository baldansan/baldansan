# usage: python3 -I mkjobs.py lNN  <  pasted jobs_wait lines "idx,jobid,completed,image,model,"url""
import sys,re,json
l=sys.argv[1]; out=[]
for line in sys.stdin:
    m=re.match(r'\s*(\d+),([0-9a-f-]{36}),(\w+),\w+,\S+?,"?(https?://\S+?)"?\s*$',line)
    if m and m.group(3)=="completed": out.append({"index":int(m.group(1)),"result_url":m.group(4)})
json.dump(out,open(f"{l}/jobs.json","w"),indent=0); print(len(out),"jobs")
