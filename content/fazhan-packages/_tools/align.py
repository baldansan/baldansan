"""ASR ↔ текст тааруулалт. Usage: align.py LESSON_DIR
Оролт: LESSON_DIR/asr_text.json, asr_words.json (asr.py), text.py (TEXT), vocab.py (VOCAB), pkg/audio/*-words.mp3
Гаралт: subtitles.json (өгүүлбэр бүрийн start/end "mm:ss.s"), vocab_audio_map.json + pkg/audio/words/wNN.mp3
Тааруулалт пиньинь (аялгагүй) үеэр Needleman–Wunsch — ASR-ийн ижил дуудлагатай буруу ханзыг тэсвэрлэнэ."""
import sys, os, json, re, subprocess
D = os.path.abspath(sys.argv[1]); sys.path.insert(0, D)
from pypinyin import lazy_pinyin
from text import TEXT
from vocab import VOCAB
HZ = re.compile(r"[一-鿿]")

def syl(ch): return lazy_pinyin(ch)[0]
def asr_stream(rows):
    out = []
    for r in rows:
        for w in r["words"]:
            chars = [c for c in w["w"] if HZ.match(c)]
            if not chars: continue
            n = len(chars); dur = (w["e"] - w["s"]) / n
            for i, c in enumerate(chars): out.append((syl(c), w["s"] + i * dur, w["s"] + (i + 1) * dur))
    return out
def nw(target, source):
    """target: list of syl; source: list of (syl,s,e). Returns map target_idx → source_idx (matched only)."""
    n, m = len(target), len(source); M, G = 2, -1
    import numpy as np
    S = np.zeros((n + 1, m + 1), dtype=np.int32); S[:, 0] = np.arange(n + 1) * G; S[0, :] = np.arange(m + 1) * G
    for i in range(1, n + 1):
        ti = target[i - 1]
        for j in range(1, m + 1):
            sc = M if ti == source[j - 1][0] else -2
            S[i, j] = max(S[i - 1, j - 1] + sc, S[i - 1, j] + G, S[i, j - 1] + G)
    i, j, mp = n, m, {}
    while i > 0 and j > 0:
        sc = M if target[i - 1] == source[j - 1][0] else -2
        if S[i, j] == S[i - 1, j - 1] + sc:
            if sc == M: mp[i - 1] = j - 1
            i -= 1; j -= 1
        elif S[i, j] == S[i - 1, j] + G: i -= 1
        else: j -= 1
    return mp
def fmt(t): return f"{int(t // 60):02d}:{t % 60:04.1f}"

# ---- text sentences ----
sents = ["".join(toks.split("|")) for _p, ss in TEXT for toks, *_ in ss]
tgt, owner = [], []
for si, s in enumerate(sents):
    for c in s:
        if HZ.match(c): tgt.append(syl(c)); owner.append(si)
src = asr_stream(json.load(open(f"{D}/asr_text.json")))
mp = nw(tgt, src)
raw = []
for si, s in enumerate(sents):
    idx = [k for k in range(len(tgt)) if owner[k] == si and k in mp]
    ok = len(idx) >= max(2, len([k for k in range(len(tgt)) if owner[k] == si]) * 0.2)
    raw.append((src[mp[idx[0]]][1], src[mp[idx[-1]]][2]) if ok else None)
miss = sum(1 for r in raw if r is None)
for si in range(len(raw)):  # алдсан өгүүлбэр: хөршүүдийн хоорондох завсар
    if raw[si] is None:
        pe = max([r[1] for r in raw[:si] if r] + [0.0]); ns = [r[0] for r in raw[si + 1:] if r]
        raw[si] = (pe + 0.1, (ns[0] - 0.1) if ns else pe + 3.0)
subs, prev_end = [], 0.0
for si, s in enumerate(sents):
    st, en = raw[si]
    st = max(st - 0.15, prev_end); en = max(en + 0.15, st + 0.5); prev_end = en
    subs.append({"chinese": s, "start": fmt(st), "end": fmt(en)})
json.dump(subs, open(f"{D}/subtitles.json", "w"), ensure_ascii=False, indent=1)
print(f"subtitles: {len(subs)}/{len(sents)} (interpolated {miss})")

# ---- word clips ----
words = [z.split("（")[0].replace("（", "").replace("）", "") for z, *_ in VOCAB]
raw_words = [z for z, *_ in VOCAB]
tgt, owner = [], []
for wi, w in enumerate(raw_words):
    for c in w:
        if HZ.match(c): tgt.append(syl(c)); owner.append(wi)
src = asr_stream(json.load(open(f"{D}/asr_words.json")))
mp = nw(tgt, src)
spans = []
for wi in range(len(words)):
    idx = [k for k in range(len(tgt)) if owner[k] == wi and k in mp]
    spans.append((src[mp[idx[0]]][1], src[mp[idx[-1]]][2]) if idx else None)
N = int(re.search(r"l(\d+)", os.path.basename(D)).group(1))
wmp3 = f"{D}/pkg/audio/fazhan-zhongji1-{N:02d}-words.mp3"
os.makedirs(f"{D}/pkg/audio/words", exist_ok=True)
bad = [raw_words[i] for i, s in enumerate(spans) if not s]
for wi in range(len(spans)):  # алдсан үг: хөршүүдийн завсар
    if spans[wi] is None:
        pe = max([s[1] for s in spans[:wi] if s] + [0.0]); ns = [s[0] for s in spans[wi + 1:] if s]
        spans[wi] = (pe + 0.3, (ns[0] - 0.3) if ns else pe + 1.5)
amap = {}
for wi, sp in enumerate(spans):
    prev_end = max([s[1] for s in spans[:wi] if s] + [0])
    nxt = [s[0] for s in spans[wi + 1:] if s]; nxt_start = nxt[0] if nxt else sp[1] + 1
    st = max(sp[0] - 0.25, prev_end + 0.05, 0); en = min(sp[1] + 0.35, nxt_start - 0.05)
    if en - st < 0.3: en = st + 0.5
    fn = f"w{wi + 1:02d}.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wmp3, "-ss", f"{st:.2f}", "-to", f"{en:.2f}", "-c:a", "libmp3lame", "-q:a", "4", f"{D}/pkg/audio/words/{fn}"], check=True)
    amap[raw_words[wi]] = f"audio/words/{fn}"
json.dump(amap, open(f"{D}/vocab_audio_map.json", "w"), ensure_ascii=False, indent=1)
print(f"word clips: {len(amap)}/{len(words)}; interpolated (шалга!): {bad}")
