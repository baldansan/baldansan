import sys,json
lo,hi=int(sys.argv[1]),int(sys.argv[2]); out=[]
for line in open('/home/claude/work/yct6/jobids.txt'):
    p=line.split()
    if len(p)==2 and lo<=int(p[0])<=hi: out.append({"index":int(p[0]),"job_id":p[1]})
print(json.dumps(out))
