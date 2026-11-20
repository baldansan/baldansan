# -*- coding: utf-8 -*-
"""新HSK教程1/2 хичээл бүрийн зургийн төлөвлөгөө: hero (16:9) + 热身/шинэ үгийн зураг (1:1, lNN_src.VOCAB-аас).
Prompt-ууд Higgsfield gpt_image_2_6-д. Хэрэглээ: python3 scripts/xinhsk3/image_plan12.py xinhsk1 → JSON (stdout)."""
import importlib.util, json, os, re, sys
from image_plan import STYLE, HERO_STYLE  # noqa — ижил стиль

HERO = {
 "xinhsk1": {
  1: "a friendly Chinese teacher greeting a small glowing AI assistant robot in a bright school office on the first day of school, students waving hello",
  2: "university students introducing themselves in a classroom, name cards on desks, a Chinese student and a French student shaking hands",
  3: "two students chatting on a green university campus, flags of China and France on their notebooks, a Chinese textbook",
  4: "a family photo on a phone: parents with a daughter and a little son, a Beijing apartment living room",
  5: "a wall calendar with a date circled, a woman relaxing at home on her day off with tea, a child playing",
  6: "two people exchanging phone numbers on smartphones at a cafe, a notebook with digits written down",
  7: "a wall clock showing half past six, an office worker leaving work, evening city street with lights",
  8: "a doctor in a white coat at a hospital entrance, a family talking about where parents work, a school building nearby",
  9: "a student studying at a school desk in the morning sunlight, a timetable on the wall, a library in the background",
  10: "a fruit market stall with shiny red apples and price tags, a shopper holding a basket, a smiling vendor",
  11: "a university campus with students carrying books, a young man reading in a library, a lecture hall",
  12: "a snowy winter street in Beijing, people in warm coats, a child catching snowflakes, a cup of hot water",
  13: "a cozy tea house, a waiter bringing a cup of hot tea on a tray, a menu on the table",
  14: "friends leaving a cinema at night, a big movie poster board without text, popcorn and tickets",
  15: "a modern airport terminal with a starfish-shaped roof, travelers with suitcases waving goodbye, an airplane taking off",
 },
 "xinhsk2": {
  1: "friends at a Beijing restaurant eating roast duck wrapped in thin pancakes, a chef slicing the duck",
  2: "students hailing a taxi outside a university gate with an old-style red gate and lake, bicycles parked nearby",
  3: "travelers planning a trip to an ancient city wall and terracotta warriors, a train ticket and a map",
  4: "a young woman trying a red dress in a clothing shop, friends giving thumbs up, a mirror",
  5: "a foreign student visiting a Chinese family home for the first time, host offering tea and fruit, shoes at the door",
  6: "a birthday party for a girl with a cake and candles, gifts, family singing, red decorations",
  7: "young people playing basketball on an outdoor court, a sweaty player scoring, friends cheering",
  8: "a forgotten umbrella and a reminder note, two friends laughing about a missed appointment, a phone with a calendar",
  9: "a bubble tea shop counter with colorful cups and straws, a customer ordering, a queue",
  10: "students studying hard at night before an exam, stacks of books, a clock, a cup of coffee",
  11: "a table full of Chinese dishes: dumplings, noodles, hot pot, friends eating with chopsticks",
  12: "a snowy northern city in deep winter versus a milder Beijing street, a person shivering in a thick coat",
  13: "a lively Chinese language class, students laughing, a teacher writing characters on a whiteboard",
  14: "a lonely student in a dorm during Spring Festival watching fireworks from the window, red lanterns outside",
  15: "a traveler looking at photos of China on a laptop, a suitcase being packed, a passport and plane ticket",
 },
}

CONCRETE_HINT = {}  # (ханз → англи prompt), хэрэгтэй бол гараар нэм
# Хичээл бүрийн «Энэ юу вэ?» үгс — бодит зүйлс л (ханз, англи prompt). VOCAB-д байгаа үгс.
WORDS = {
 "xinhsk1": {
  1: [("老师", "a friendly female teacher standing by a whiteboard"), ("学生", "a university student with a backpack and books"), ("同学", "two classmates sitting together at a desk")],
  2: [("名字", "a name card badge with a blank line"), ("李文", "a young Chinese man smiling, portrait"), ("安妮", "a young Canadian woman with light brown hair, portrait")],
  3: [("人", "a group of three people standing"), ("姐姐", "an elder sister hugging a younger child"), ("女朋友", "a young couple holding hands"), ("中文", "an open Chinese textbook with characters"), ("工作", "an office worker at a desk with a laptop")],
  4: [("爸爸", "a father holding a child"), ("妈妈", "a mother with a child"), ("哥哥", "an elder brother and a little boy"), ("妹妹", "a little girl, younger sister"), ("儿子", "a small boy, son"), ("家", "a cozy family house")],
  5: [("星期", "a weekly calendar page"), ("今天", "a calendar with today circled in red"), ("面条儿", "a bowl of noodles with chopsticks"), ("月", "a monthly calendar grid")],
  6: [("手机", "a modern smartphone"), ("电话", "a landline telephone"), ("超市", "a supermarket storefront with shopping carts"), ("东西", "a shopping bag full of groceries"), ("号", "a door number plate with digits")],
  7: [("早上", "sunrise over a city, early morning"), ("下午", "afternoon sun over a park"), ("电影院", "a cinema building with a marquee"), ("课", "a classroom lesson in progress"), ("现在", "a wall clock")],
  8: [("房间", "a tidy bedroom"), ("猫", "a cute cat"), ("桌子", "a wooden table"), ("学校", "a school building with a flag"), ("医院", "a hospital building with a red cross")],
  9: [("椅子", "a wooden chair"), ("书", "a stack of books"), ("前边", "a person standing in front of a building"), ("外边", "a garden outside a house"), ("学校", "a school campus")],
  10: [("苹果", "a red apple"), ("杯子", "a glass cup"), ("钱", "Chinese yuan banknotes and coins"), ("水果", "a basket of mixed fruit"), ("售货员", "a shop assistant at a counter"), ("商店", "a small shop storefront")],
  11: [("大学", "a university campus gate"), ("饭店", "a restaurant entrance"), ("车", "a car"), ("大学生", "a college student with a laptop"), ("医", "a doctor with a stethoscope")],
  12: [("雪", "snow falling on a street"), ("雨", "rain with an umbrella"), ("天气", "weather icons: sun, cloud, rain"), ("公司", "an office building"), ("药", "medicine pills and a bottle")],
  13: [("茶", "a cup of hot tea"), ("面包", "a loaf of bread"), ("鸡蛋", "three eggs"), ("早饭", "a breakfast table with milk and bread"), ("服务员", "a waiter holding a tray")],
  14: [("火车", "a train"), ("汉字", "a brush-written Chinese character on paper"), ("电影", "a movie theater screen with seats"), ("中午", "midday sun over a city"), ("字", "a notebook with handwritten characters")],
  15: [("飞机", "an airplane in the sky"), ("机场", "an airport terminal"), ("男朋友", "a young couple, boyfriend and girlfriend"), ("家人", "a family of four together"), ("小时", "an hourglass next to a clock")],
 },
 "xinhsk2": {
  1: [("北京烤鸭", "a plate of Peking roast duck with thin pancakes and sauce")],
  2: [("公交车", "a city bus"), ("车站", "a bus stop sign with a bench"), ("票", "a paper ticket"), ("教室", "a classroom with desks"), ("北京大学", "an old university gate with a lake and pagoda")],
  3: [("手", "a human hand")],
  4: [("商场", "a shopping mall interior"), ("裤子", "a pair of trousers"), ("书包", "a school backpack"), ("红色", "a red fabric swatch"), ("颜色", "a color palette with paint"), ("白色", "a white T-shirt")],
  5: [("爷爷", "a smiling grandfather"), ("奶奶", "a smiling grandmother"), ("礼物", "a wrapped gift box"), ("奶茶", "a cup of milk tea"), ("酒店", "a hotel building")],
  6: [("蛋糕", "a birthday cake with candles"), ("鱼", "a fish"), ("肉", "a piece of meat on a plate"), ("床", "a bed"), ("画笔", "a paintbrush with paint")],
  7: [("篮球", "a basketball"), ("足球", "a football"), ("球", "a ball"), ("运动", "a person running"), ("爱好", "a guitar, a camera and a book together")],
  8: [("手表", "a wristwatch"), ("妻子", "a wife, a young woman portrait"), ("丈夫", "a husband, a young man portrait"), ("饭馆", "a small Chinese restaurant"), ("左边", "an arrow pointing left")],
  9: [("咖啡", "a cup of coffee"), ("男孩儿", "a boy"), ("门口", "a doorway entrance"), ("周", "a weekly calendar"), ("个子", "two people of different heights")],
  10: [("门", "a door"), ("笔", "a pen"), ("本子", "a notebook"), ("词", "a word card"), ("题", "an exam question sheet")],
  11: [("头", "a human head, side view"), ("药", "medicine pills and a bottle"), ("身体", "a healthy human body silhouette"), ("药店", "a pharmacy storefront"), ("路上", "a person walking on a road")],
  12: [("地铁", "a subway train"), ("楼", "a tall building"), ("站", "a metro station entrance"), ("外面", "a view outside a window"), ("事情", "a to-do list")],
  13: [("新年", "red lanterns and fireworks for New Year"), ("花", "a bouquet of flowers"), ("洗手间", "a restroom sign and sink"), ("班", "a class of students"), ("上面", "a cat on top of a box")],
  14: [("包", "a handbag"), ("房子", "a house"), ("小孩儿", "a small child"), ("女孩儿", "a girl"), ("眼睛", "a pair of eyes")],
  15: [("机场", "an airport terminal"), ("机票", "a plane ticket"), ("门票", "an entrance ticket"), ("鸟", "a bird"), ("路", "a road"), ("高中", "a high school building")],
 },
}
POS = re.compile(r"^(n|v|adj|adv|pron|prep|conj|part|m|num|mod|int|interj)\.?(/.*)?$")


def gloss_map(level, n):
    """ppt.txt-ийн үг бүрийн слайдаас (ханз → англи gloss)."""
    out = {}
    try:
        t = open("/home/claude/work/xinhsk12/src/h%d/L%02d/ppt.txt" % (level, n), encoding="utf-8").read()
    except FileNotFoundError:
        return out
    for slide in t.split("===== SLIDE "):
        lines = [l.strip() for l in slide.splitlines() if l.strip()]
        if "生 词" not in lines and "New Words" not in lines:
            continue
        for ln in lines:
            if " | " in ln:
                c = [x.strip() for x in ln.split("|")]
                if len(c) >= 3 and re.match(r"^[一-鿿]+$", c[0]):
                    out.setdefault(c[0], c[-1] if c[-1] else c[-2])
        zh = "".join(l for l in lines if re.match(r"^[一-鿿]{1,2}$", l))
        for i, ln in enumerate(lines):
            if POS.match(ln) and i + 1 < len(lines) and re.search(r"[A-Za-z]", lines[i + 1]) and zh:
                out.setdefault(zh, lines[i + 1]); break
    return out


def load(course, n):
    pkg = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "content", "%s-packages" % course)
    spec = importlib.util.spec_from_file_location("l%02d_src" % n, os.path.join(pkg, "l%02d_src.py" % n))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


if __name__ == "__main__":
    course = sys.argv[1]
    out = {}
    for n, hero in HERO[course].items():
        try:
            m = load(course, n)
        except FileNotFoundError:
            continue
        vocab = {v[0]: v for v in m.VOCAB}
        words = []
        for zh, en in WORDS[course][n]:
            v = vocab.get(zh)
            if not v:
                continue  # энэ хичээлийн үг биш бол алгасна
            words.append({"zh": zh, "py": v[1], "mn": v[2], "en": en, "prompt": STYLE + en})
        out[n] = {"hero": HERO_STYLE + hero, "title": m.TITLE_ZH, "words": words}
    print(json.dumps(out, ensure_ascii=False, indent=1))
