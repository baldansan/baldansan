#!/usr/bin/env python3
"""Бичих сургалтын ханзыг радикалын бүлэгт хуваах скрипт.

Оролт:  public/data/hsk30_handwritten.json, public/data/char_breakdown_full.json
Гаралт: public/data/hsk30_handwriting_groups.json
"""
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"

MIN_GROUP = 4      # үүнээс цөөн бол "Холимог" руу
MAX_GROUP = 12     # үүнээс олон бол хэсэглэнэ
SPLIT_TARGET = (8, 12)  # хэсэглэхдээ 8-12 ханзтай байлгана

handwritten = json.loads((DATA / "hsk30_handwritten.json").read_text(encoding="utf-8"))
breakdown = json.loads((DATA / "char_breakdown_full.json").read_text(encoding="utf-8"))

# Радикал -> монгол нэрийн толь (бүх breakdown-оос, зөрчилгүй нь шалгагдсан)
radical_mn: dict[str, str] = {}
for info in breakdown.values():
    r, rmn = info.get("r"), info.get("rmn")
    if r and rmn and r not in radical_mn:
        radical_mn[r] = rmn


def complexity(ch: str) -> int:
    """Бүрдлийн тоо — энгийнээс нийлмэл рүү эрэмбэлэх түлхүүр."""
    info = breakdown.get(ch, {})
    return len(info.get("c", [])) or 1


def radical_of(ch: str) -> str:
    info = breakdown.get(ch, {})
    r = info.get("r")
    if r:
        return r
    comps = info.get("c")
    if comps:
        return comps[0]["ch"]
    return "Бусад"


def split_chunks(chars: list[str]) -> list[list[str]]:
    """12-оос олон ханзтай бүлгийг 8-12 ханзтай хэсгүүдэд хуваана."""
    n = len(chars)
    if n <= MAX_GROUP:
        return [chars]
    # хэсгийн тоог аль болох цөөн, хэсэг бүр нь 8-12 байхаар сонгоно
    parts = (n + MAX_GROUP - 1) // MAX_GROUP
    while parts * SPLIT_TARGET[1] < n:
        parts += 1
    base, extra = divmod(n, parts)
    chunks, i = [], 0
    for k in range(parts):
        size = base + (1 if k < extra else 0)
        chunks.append(chars[i : i + size])
        i += size
    return chunks


result: dict[str, list[dict]] = {}

for level, chars in handwritten.items():
    by_rad: dict[str, list[str]] = defaultdict(list)
    for ch in chars:
        by_rad[radical_of(ch)].append(ch)

    named_groups = []   # (avg_complexity, title, radical, chars)
    small_pool = []     # жижиг бүлгүүдийн ханзнууд (Холимог руу)

    for rad, members in by_rad.items():
        members.sort(key=lambda c: (complexity(c), c))  # энгийн -> нийлмэл, тогтвортой
        if len(members) < MIN_GROUP:
            small_pool.extend(members)
            continue
        rmn = radical_mn.get(rad)
        title = f"{rad} {rmn}" if rmn else rad
        chunks = split_chunks(members)
        for idx, chunk in enumerate(chunks, 1):
            part_title = f"{title} {idx}" if len(chunks) > 1 else title
            avg = sum(complexity(c) for c in chunk) / len(chunk)
            named_groups.append((avg, part_title, rad, chunk))

    # Нэрлэсэн бүлгүүд: дундаж бүрдлийн тоо өсөхөөр, тэнцвэл радикалын дарааллаар
    named_groups.sort(key=lambda g: (g[0], g[2], g[1]))

    level_groups = [
        {"title": title, "radical": rad, "chars": chunk}
        for _, title, rad, chunk in named_groups
    ]

    # "Холимог" бүлгүүд хамгийн сүүлд (≤12 ханзтай хэсгүүдээр)
    small_pool.sort(key=lambda c: (complexity(c), c))
    if small_pool:
        chunks = split_chunks(small_pool)
        many = len(chunks) > 1
        for idx, chunk in enumerate(chunks, 1):
            level_groups.append(
                {
                    "title": f"Холимог {idx}" if many else "Холимог",
                    "radical": "",
                    "chars": chunk,
                }
            )

    result[level] = level_groups

# ===== ШАЛГАЛТ =====
total = 0
for level, chars in handwritten.items():
    grouped = [c for g in result[level] for c in g["chars"]]
    assert len(grouped) == len(set(grouped)), f"{level}: давхардсан ханз байна"
    assert sorted(grouped) == sorted(chars), f"{level}: ханз алга болсон/илүү гарсан"
    for g in result[level]:
        assert 1 <= len(g["chars"]) <= MAX_GROUP, f"{level}: {g['title']} хэмжээ {len(g['chars'])}"
    total += len(grouped)
assert total == 1200, f"нийт {total} != 1200"

out = DATA / "hsk30_handwriting_groups.json"
out.write_text(
    json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
)
print(f"OK: {total}/1200 ханз, түвшин бүрийн бүлгийн тоо:",
      {k: len(v) for k, v in result.items()})
