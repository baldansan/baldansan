"""Shared helpers for the kids' story ingest scripts (scripts/open/*.py).

- to_simplified(text): OpenCC t2s (opencc-python-reimplemented)
- segment(text): forward maximum matching against data/hsk_words.json + pypinyin phrase dict
- to_pinyin(text): word-spaced tone-mark pinyin (pypinyin Style.TONE, per-char readings
  computed on the whole sentence so pypinyin's phrase context is used, then grouped by word)
- hsk_level(text): estimated HSK level = highest HSK level (1..7, 7 = "7-9") among
  words found in data/hsk_words.json; None if no HSK word found.

pip install pypinyin opencc-python-reimplemented --break-system-packages
"""
import json
import os
import re

from pypinyin import Style, lazy_pinyin
from pypinyin.constants import PHRASES_DICT

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
HAN = re.compile(r"[㐀-鿿豈-﫿]")

_hsk = None
_dict = None
_maxlen = 1
_cc = None


def _load():
    global _hsk, _dict, _maxlen
    if _hsk is not None:
        return
    words = json.load(open(os.path.join(REPO, "data", "hsk_words.json"), encoding="utf-8"))
    _hsk = {}
    for w in words:
        lv = w.get("hsk_level")
        lv = 7 if lv == "7-9" else int(lv)
        s = w["simplified"]
        if s not in _hsk or lv < _hsk[s]:
            _hsk[s] = lv
    _dict = set(_hsk) | {k for k in PHRASES_DICT if len(k) <= 6}
    _maxlen = max(len(k) for k in _dict)
    _maxlen = min(_maxlen, 6)


def to_simplified(text):
    global _cc
    if _cc is None:
        import opencc
        _cc = opencc.OpenCC("t2s")
    # keep common forms where OpenCC outputs CJK Ext-B characters most fonts cannot render
    return _cc.convert(text).replace("\U00029F7E\U00029F8C", "鮟鱇")


def segment(text):
    """Forward maximum matching. Non-Han runs are kept as single tokens."""
    _load()
    out = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if not HAN.match(ch):
            j = i + 1
            while j < n and not HAN.match(text[j]) and not text[j].isspace() and text[j].isalnum() == ch.isalnum():
                j += 1
            out.append(text[i:j])
            i = j
            continue
        for L in range(min(_maxlen, n - i), 0, -1):
            w = text[i:i + L]
            if L == 1 or (w in _dict and all(HAN.match(c) for c in w)):
                out.append(w)
                i += L
                break
    return out


_NO_SPACE_BEFORE = set("，。！？、；：,.!?;:)）」』”’》…—")
_NO_SPACE_AFTER = set("（(「『“‘《")


def to_pinyin(text):
    """Word-spaced tone-mark pinyin. Punctuation stays attached to the neighbouring word."""
    if not text:
        return ""
    chars = lazy_pinyin(text, style=Style.TONE, errors=lambda s: list(s))
    if len(chars) != len(text):  # safety: fall back to per-char
        chars = [lazy_pinyin(c, style=Style.TONE, errors=lambda s: list(s))[0] for c in text]
    toks = []
    pos = 0
    for w in segment(text):
        seg = chars[pos:pos + len(w)]
        pos += len(w)
        if w.isspace():
            toks.append(" ")
            continue
        if HAN.match(w[0]):
            toks.append(("w", "".join(seg)))
        else:
            toks.append(("p", w))
    res = ""
    prev = None
    for t in toks:
        if t == " ":
            if res and not res.endswith(" "):
                res += " "
            prev = None
            continue
        kind, s = t
        if res and not res.endswith(" "):
            if kind == "p" and (s[0] in _NO_SPACE_BEFORE):
                pass
            elif prev is not None and prev[0] == "p" and prev[1][-1] in _NO_SPACE_AFTER:
                pass
            else:
                res += " "
        res += s
        prev = t
    return re.sub(r"\s+", " ", res).strip()


def hsk_level(text):
    _load()
    lv = None
    for w in segment(text):
        if w in _hsk:
            lv = max(lv or 0, _hsk[w])
        elif len(w) > 1 and HAN.match(w[0]):
            # compound not in HSK list: use its characters that are HSK words
            for c in w:
                if c in _hsk:
                    lv = max(lv or 0, _hsk[c])
    return lv


def hsk_profile(text, pct=0.9):
    """(hsk_max, hsk_p90): max level, and smallest level covering >= pct of HSK-listed word tokens."""
    _load()
    lv = [_hsk[w] for w in segment(text) if w in _hsk]
    if not lv:
        return None, None
    lv.sort()
    return max(lv), lv[min(len(lv) - 1, int(len(lv) * pct + 0.5) - 1 if len(lv) > 1 else 0)]


def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


def make_cover(src_bytes_or_path, dest, max_bytes=40 * 1024, max_side=320):
    """Resize an image to a small JPEG cover <= max_bytes. Returns final size in bytes."""
    import io
    from PIL import Image
    if isinstance(src_bytes_or_path, (bytes, bytearray)):
        im = Image.open(io.BytesIO(src_bytes_or_path))
    else:
        im = Image.open(src_bytes_or_path)
    im = im.convert("RGB")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    side = max_side
    while True:
        im2 = im.copy()
        im2.thumbnail((side, side))
        for q in (80, 70, 60, 50, 40):
            buf = io.BytesIO()
            im2.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
            if buf.tell() <= max_bytes:
                open(dest, "wb").write(buf.getvalue())
                return buf.tell()
        side = int(side * 0.8)
