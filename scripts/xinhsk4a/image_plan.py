# -*- coding: utf-8 -*-
"""新HSK教程4上 хичээл бүрийн зургийн төлөвлөгөө: hero (16:9) + 热身 үгс (1:1). Higgsfield gpt_image_2_6 prompt.
Хэрэглээ: python3 scripts/xinhsk4a/image_plan.py → JSON (stdout)."""
import json

STYLE = "Simple clean flat vector illustration, soft warm pastel colors, plain white background, no text, no letters, no watermark, friendly educational flashcard style. "
HERO_STYLE = "Warm flat illustration in a modern textbook style for young adults, soft colors, gentle lighting, no text, no letters. Scene: "

HERO = {
 1: "two international students at a Chinese university office receiving student ID cards from a smiling teacher, campus buildings and a dining hall outside the window",
 2: "a young woman and her boyfriend viewing a bright rental apartment with a landlord, living room, kitchen, boxes for moving in, a small garden outside",
 3: "a busy Chinese city street where people pay by scanning a phone, a delivery courier on an electric scooter with parcels, a smartphone with a padlock icon",
 4: "a subway station in Beijing: a stranger helping a worried student buy a ticket at a machine, a breakfast cart and fresh flowers stall near the gates, e-bikes outside",
 5: "four friends sharing a lively lunch at a round table in a Chinese restaurant with spicy dishes, hot pot steam, chili peppers and tea",
 6: "a hospital hall in China with a registration counter, a young man helping his girlfriend who has a fever and a cough, a nurse and a doctor in white coats",
 7: "a modern office where colleagues ask a young professional for advice, laptop, whiteboard with a growth chart without text, a window with a city view",
 8: "friends relaxing on a weekend trip in the countryside outside the city, hills and lake, a picnic, one person stretching after a long work week",
 9: "a romantic birthday dinner for two at a cozy restaurant, a small cake with candles, chocolates and roses, and a happy couple getting married in the background",
 10: "a split scene: a snowy northern Chinese city with ice sculptures and people in thick coats, and a warm green southern city with palm trees and rain, a family calling by video",
}

# (ханз, пиньинь, монгол, англи prompt)
WORDS = {
 1: [("证件","zhèngjiàn","бичиг баримт","a passport and an ID card lying on a table"),("博士","bóshì","доктор (эрдмийн зэрэг)","a graduate in a doctoral gown and cap holding a diploma"),("食堂","shítáng","цайны газар (оюутны)","a university dining hall with trays of food and long tables"),("材料","cáiliào","материал, баримт бичиг","a stack of documents and forms in a folder"),("教师","jiàoshī","багш","a teacher standing at a lectern in a classroom"),("加油","jiāyóu","зүтгэ, тэвчээртэй бай","a cheering friend raising a fist to encourage a runner")],
 2: [("客厅","kètīng","зочны өрөө","a cozy living room with a sofa, TV and a coffee table"),("种","zhòng","тарих","hands planting a small green plant in soil"),("收拾","shōushi","цэгцлэх, эмхлэх","a person tidying up a messy room, folding clothes into boxes"),("毕业","bìyè","төгсөх","students in graduation gowns throwing caps in the air"),("厨房","chúfáng","гал тогооны өрөө","a clean modern kitchen with a stove, sink and cabinets"),("价格","jiàgé","үнэ","a price tag with a yuan symbol hanging on a product")],
 3: [("法律","fǎlǜ","хууль","a wooden gavel and a law book on a desk"),("扫码支付","sǎomǎ zhīfù","QR код уншуулж төлөх","a hand holding a smartphone scanning a QR code at a shop counter"),("网购","wǎnggòu","онлайнаар худалдан авах","a laptop with a shopping cart icon and parcels beside it"),("快递员","kuàidìyuán","хүргэлтийн ажилтан","a delivery courier with a box standing beside an electric scooter"),("管","guǎn","хариуцах, удирдах","a manager pointing at a schedule board while supervising a team"),("保护","bǎohù","хамгаалах","two hands protecting a small sprout, a shield icon")],
 4: [("袋子","dàizi","уут","a brown paper shopping bag full of groceries"),("感谢","gǎnxiè","баярлах, талархах","a person bowing slightly with hands together thanking another person"),("早餐","zǎocān","өглөөний цай","a breakfast of steamed buns, an egg and a glass of milk"),("乘客","chéngkè","зорчигч","passengers sitting and standing inside a subway car"),("鲜花","xiānhuā","шинэ цэцэг","a bouquet of fresh colorful flowers"),("电动车","diàndòngchē","цахилгаан мотоцикл","an electric scooter parked on a city sidewalk")],
 5: [("辣子鸡","làzǐjī","чинжүүтэй тахиа","a plate of spicy chicken pieces with many red chili peppers"),("红烧羊肉","hóngshāo yángròu","улаан шөлтэй хонины мах","a bowl of braised lamb in dark red sauce"),("松鼠鳜鱼","sōngshǔ guìyú","«хэрэм» загас (чихэрлэг исгэлэн)","a whole fried fish with sweet and sour sauce shaped like a squirrel tail"),("酸汤米线","suāntāng mǐxiàn","исгэлэн шөлтэй будааны гоймон","a bowl of rice noodles in sour tomato soup with herbs"),("酸","suān","исгэлэн","a sliced lemon and a face squinting from sourness"),("甜","tián","амттай, чихэрлэг","a slice of cake with strawberries and a lollipop"),("咸","xián","давслаг","a salt shaker and salted peanuts"),("辣","là","халуун ногоотой","red chili peppers and a face with a red mouth")],
 6: [("汗","hàn","хөлс","a person wiping sweat from the forehead with a towel"),("醒","xǐng","сэрэх","a person waking up in bed stretching, sunlight through the window"),("护士","hùshi","сувилагч","a nurse in a uniform holding a clipboard"),("打针","dǎzhēn","тариа хийх","a nurse giving an injection into a patient's arm"),("咳嗽","késou","ханиах","a person coughing into the elbow, wearing a scarf"),("大厅","dàtīng","том танхим","a spacious hospital lobby with a reception desk")],
 7: [("市场","shìchǎng","зах зээл","a busy market with stalls and a chart of rising sales"),("想法","xiǎngfǎ","санаа, бодол","a person with a glowing light bulb above the head"),("打扰","dǎrǎo","саад болох","a person knocking on an office door while a colleague works at a desk"),("谈","tán","ярилцах","two businesspeople talking across a table"),("计划","jìhuà","төлөвлөгөө","a planner notebook with a checklist and a calendar"),("出差","chūchāi","албан томилолтоор явах","a businessperson with a suitcase and laptop bag at an airport")],
 8: [("参观","cānguān","үзэж сонирхох","tourists visiting a museum exhibition hall"),("加班","jiābān","илүү цагаар ажиллах","an office worker at a desk at night with a lamp and a clock"),("下降","xiàjiàng","буурах","a chart with an arrow going down"),("风景","fēngjǐng","байгалийн үзэмж","a beautiful mountain lake landscape with trees"),("乘坐","chéngzuò","суух (тээврийн хэрэгсэлд)","passengers boarding a high-speed train"),("帽子","màozi","малгай","a sun hat with a wide brim")],
 9: [("浪漫","làngmàn","романтик","a couple having a candlelit dinner with roses"),("人生","rénshēng","хүний амьдрал","a winding path from childhood to old age with milestones"),("巧克力","qiǎokèlì","шоколад","a box of chocolates with a red ribbon"),("支持","zhīchí","дэмжих","a person placing a supportive hand on a friend's shoulder"),("耐心","nàixīn","тэвчээр","a calm person patiently teaching a child to tie shoes"),("祝","zhù","ерөөх","a person raising a glass in a toast at a celebration")],
 10: [("寒假","hánjià","өвлийн амралт","students leaving a school with suitcases in winter, snow falling"),("温度","wēndù","температур","a thermometer showing a low temperature with snowflakes"),("误会","wùhuì","буруу ойлгох","two people with confused faces and crossed speech bubbles"),("植物","zhíwù","ургамал","green houseplants in pots on a windowsill"),("拒绝","jùjué","татгалзах","a person politely raising a hand to decline a gift"),("垃圾","lājī","хог","a trash bin with sorted recycling bags beside it")],
}

if __name__ == "__main__":
    out = {}
    for n, hero in HERO.items():
        out[n] = {"hero": HERO_STYLE + hero, "words": [{"zh": zh, "py": py, "mn": mn, "en": en, "prompt": STYLE + en} for zh, py, mn, en in WORDS[n]]}
    print(json.dumps(out, ensure_ascii=False, indent=1))
