#!/usr/bin/env python3
"""Андуурч болзошгүй ханзны бүлгүүд (нэг дуу заагч хэсэгтэй, өөр язгууртай).

清·请·情·晴 маягийн 形声 гэр бүлүүдийг char_breakdown_full-ээс гаргана:
ханз бүрийн язгуур-биш бүрэлдэхүүнээр бүлэглэж, ≥2 гишүүнтэй бүлгийг
public/data/hsk_confusables.json болгож хадгална.
"""
import json
import re
from collections import defaultdict

BREAKDOWN = "public/data/char_breakdown_full.json"
WORDS = "data/hsk_words.json"
OUT = "public/data/hsk_confusables.json"

STROKE_LIKE = set("丶丿一乙亅冫")  # цэвэр зурлага — бүлэглэхэд утгагүй


def short_mn(meaning: str) -> str:
    part = re.split(r"[;,;，、(（·]", meaning)[0].strip()
    return part[:22]


def main() -> None:
    breakdown = json.load(open(BREAKDOWN, encoding="utf-8"))
    words = json.load(open(WORDS, encoding="utf-8"))

    # Нэг ханзтай үгс — pinyin/утгын эх сурвалж
    char_word = {}
    for w in words:
        s = w["simplified"]
        if len(s) == 1 and s not in char_word:
            char_word[s] = w

    # HSK үгэнд ордог бүх ханз (олон ханзтай үгийн гишүүд ч орно)
    hsk_chars = set()
    for w in words:
        for ch in w["simplified"]:
            hsk_chars.add(ch)

    # component -> түүнийг (язгуур бишээр) агуулсан ханзууд
    families = defaultdict(set)
    comp_gloss = {}
    for ch in hsk_chars:
        info = breakdown.get(ch)
        if not info:
            continue
        radical = info.get("r")
        for comp in info.get("c", []):
            cc = comp.get("ch")
            if not cc or cc in STROKE_LIKE or cc == radical:
                continue
            families[cc].add(ch)
            if comp.get("mn"):
                comp_gloss[cc] = comp["mn"]
        # Ханз өөрөө бусдын дуу заагч бол өөрийнхөө гэр бүлд орно
        if ch in families:
            families[ch].add(ch)

    # Ханз өөрөө component болдог тохиолдлыг нэм (青 → 清 гэр бүлд)
    for comp in list(families.keys()):
        if comp in hsk_chars:
            families[comp].add(comp)

    def entry(ch: str):
        w = char_word.get(ch)
        info = breakdown.get(ch) or {}
        if not w:
            return None
        return {
            "c": ch,
            "p": w["pinyin"],
            "m": short_mn(w.get("meaning_mn") or ""),
            "r": info.get("r") or w.get("radical") or "",
            "rm": (info.get("rmn") or "").split("(")[0].strip(),
        }

    out = {}
    for comp, members in families.items():
        # Зөвхөн pinyin/утгатай (нэг ханзтай үг болдог) гишүүд харагдана
        rich = [m for m in sorted(members) if m in char_word]
        if len(rich) < 2:
            continue
        for ch in rich:
            others = [e for m in rich if m != ch for e in [entry(m)] if e]
            if not others:
                continue
            others.sort(key=lambda e: char_word[e["c"]].get("frequency") or 99999)
            others = others[:6]
            prev = out.get(ch)
            # Ханз хэд хэдэн бүлэгт орвол ТОМ бүлгийг нь сонгоно
            if prev is None or len(others) > len(prev["list"]):
                out[ch] = {
                    "k": comp,
                    "km": comp_gloss.get(comp, ""),
                    "list": others,
                }

    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False,
              separators=(",", ":"))

    print(f"chars with confusables: {len(out)}")
    for probe in ["清", "情", "请", "妈", "吗", "青"]:
        e = out.get(probe)
        if e:
            print(probe, "→", e["k"], [x["c"] for x in e["list"]])


if __name__ == "__main__":
    main()
