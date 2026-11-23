-- Толь бичиг v2 — JSON-оос нэг үгийг бүтнээр оруулах функц + 8 үгийн жишиг бичилт.
-- Жишиг нь Мэнкэлэнгийн баялаг хэв маягийг Халх монголоор дуурайсан, багшид үзүүлэх стандарт.
-- Статус 'reviewed' — багш (ерөнхий редактор) admin самбараас approved болгоно.

create or replace function public.dictionary_upsert_from_json(
  p_simplified text, p_level text, p_doc jsonb, p_status text default 'draft', p_source text default 'teacher'
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_word_id bigint;
  v_sense jsonb;
  v_ex jsonb;
  v_sense_id bigint;
  i int := 0;
  j int;
begin
  select id into v_word_id from public.hsk_words
   where simplified = p_simplified and hsk_level = p_level
   order by id limit 1;
  if v_word_id is null then
    select id into v_word_id from public.hsk_words where simplified = p_simplified order by id limit 1;
  end if;
  if v_word_id is null then
    raise notice 'hsk_words-д байхгүй: %', p_simplified;
    return null;
  end if;

  insert into public.dictionary_entries (word_id, status, usage_note_mn, measure_words, collocations, confusable_with, register, source)
  values (
    v_word_id, p_status,
    p_doc->>'usage_note_mn',
    case when jsonb_typeof(p_doc->'measure_words') = 'array' then array(select jsonb_array_elements_text(p_doc->'measure_words')) end,
    p_doc->'collocations',
    case when jsonb_typeof(p_doc->'confusable_with') = 'array' then array(select jsonb_array_elements_text(p_doc->'confusable_with')) end,
    p_doc->>'register', p_source
  )
  on conflict (word_id) do update set
    status = excluded.status, usage_note_mn = excluded.usage_note_mn, measure_words = excluded.measure_words,
    collocations = excluded.collocations, confusable_with = excluded.confusable_with,
    register = excluded.register, source = excluded.source;

  delete from public.dictionary_senses where word_id = v_word_id;

  for v_sense in select * from jsonb_array_elements(p_doc->'senses') loop
    i := i + 1;
    insert into public.dictionary_senses (word_id, sense_no, pos, gloss_zh, meaning_mn, synonyms_mn, meaning_en, note_mn, status)
    values (
      v_word_id, i, v_sense->>'pos', v_sense->>'gloss_zh', coalesce(v_sense->>'meaning_mn', '—'),
      case when jsonb_typeof(v_sense->'synonyms_mn') = 'array' then array(select jsonb_array_elements_text(v_sense->'synonyms_mn')) end,
      v_sense->>'meaning_en', nullif(v_sense->>'note_mn', ''), p_status
    ) returning id into v_sense_id;
    j := 0;
    for v_ex in select * from jsonb_array_elements(coalesce(v_sense->'examples', '[]'::jsonb)) loop
      j := j + 1;
      insert into public.dictionary_examples (sense_id, example_no, zh, pinyin, mn, source)
      values (v_sense_id, j, v_ex->>'zh', v_ex->>'pinyin', v_ex->>'mn', p_source);
    end loop;
  end loop;
  return v_word_id;
end $$;

-- ───────────────────────── Жишиг 8 үг ─────────────────────────

select public.dictionary_upsert_from_json('看', '1', $j$
{"register":"хоёулаа","measure_words":[],"confusable_with":["见","看见","瞧"],
 "usage_note_mn":"看 бол «харах» үйлийн өөрөө (ухамсартай); 见 нь «харагдах, үзэгдэх» гэсэн үр дүн. Эмч, ном, кино, найз — бүгдэд 看 хэрэглэнэ: 看医生 эмчид үзүүлэх, 看书 ном унших.",
 "collocations":[{"zh":"看书","pinyin":"kàn shū","mn":"ном унших"},{"zh":"看电影","pinyin":"kàn diànyǐng","mn":"кино үзэх"},{"zh":"看医生","pinyin":"kàn yīshēng","mn":"эмчид үзүүлэх"},{"zh":"看朋友","pinyin":"kàn péngyou","mn":"найзтайгаа очиж уулзах"},{"zh":"看来","pinyin":"kànlái","mn":"харахад, бодвол"}],
 "senses":[
  {"pos":"v","gloss_zh":"使视线接触人或物","meaning_mn":"харах","synonyms_mn":["үзэх","ажиглах","ширтэх","тольдох","нүд тусгах"],"meaning_en":"to look at; to watch; to see","note_mn":"Хамгийн үндсэн утга. Кино, зураг, телевиз — «үзэх».",
   "examples":[{"zh":"你看，那是我们老师。","pinyin":"Nǐ kàn, nà shì wǒmen lǎoshī.","mn":"Хараач, тэр манай багш байна."},{"zh":"我晚上喜欢看电视。","pinyin":"Wǒ wǎnshang xǐhuan kàn diànshì.","mn":"Би орой телевиз үзэх дуртай."}]},
  {"pos":"v","gloss_zh":"阅读","meaning_mn":"унших","synonyms_mn":["уншиж үзэх","нүдээр гүйлгэх","ном шагайх"],"meaning_en":"to read","note_mn":"Ном, сонин, мессеж — монголоор «унших», хятадаар 看. 读 нь чангаар унших гэдгийг илүү илэрхийлнэ.",
   "examples":[{"zh":"我每天看半个小时书。","pinyin":"Wǒ měitiān kàn bàn ge xiǎoshí shū.","mn":"Би өдөр бүр хагас цаг ном уншдаг."},{"zh":"你看了我的短信吗？","pinyin":"Nǐ kàn le wǒ de duǎnxìn ma?","mn":"Миний мессежийг уншсан уу?"}]},
  {"pos":"v","gloss_zh":"访问；探望","meaning_mn":"эргэх, очиж уулзах","synonyms_mn":["эргэж очих","зочлох","сурагчлах","золгох"],"meaning_en":"to visit; to call on","note_mn":"Хүнийг «үзэх» биш — очиж уулзах, эргэх гэсэн утга.",
   "examples":[{"zh":"周末我去看爷爷。","pinyin":"Zhōumò wǒ qù kàn yéye.","mn":"Амралтын өдөр би өвөөгөө эргэнэ."},{"zh":"他病了，我们去看看他吧。","pinyin":"Tā bìng le, wǒmen qù kànkan tā ba.","mn":"Тэр өвдсөн, эргэж очъё."}]},
  {"pos":"v","gloss_zh":"诊治","meaning_mn":"(эмчид) үзүүлэх; (эмч) үзэх","synonyms_mn":["үзүүлэх","шинжлүүлэх","эмчлүүлэх"],"meaning_en":"to see (a doctor); to treat (a patient)","note_mn":"看病 = өвчнөө үзүүлэх; 看医生 = эмчид үзүүлэх. Эмч талаас: 医生给我看病 — эмч намайг үзлээ.",
   "examples":[{"zh":"我头疼，想去看医生。","pinyin":"Wǒ tóu téng, xiǎng qù kàn yīshēng.","mn":"Толгой өвдөж байна, эмчид үзүүлмээр байна."},{"zh":"这个医生看病很认真。","pinyin":"Zhège yīshēng kànbìng hěn rènzhēn.","mn":"Энэ эмч өвчтөнөө их нямбай үздэг."}]},
  {"pos":"v","gloss_zh":"认为；判断","meaning_mn":"гэж үзэх, бодох","synonyms_mn":["үзэх","санах","дүгнэх","гэж харах"],"meaning_en":"to think; to judge; in one's opinion","note_mn":"我看 = миний бодлоор; 看来 = харахад.",
   "examples":[{"zh":"我看他今天不会来了。","pinyin":"Wǒ kàn tā jīntiān bú huì lái le.","mn":"Миний бодлоор тэр өнөөдөр ирэхгүй."},{"zh":"你看这个办法行不行？","pinyin":"Nǐ kàn zhège bànfǎ xíng bu xíng?","mn":"Чи энэ аргыг болох гэж үзэж байна уу?"}]},
  {"pos":"u","gloss_zh":"用在动词或动词结构后面，表示试一试","meaning_mn":"…-ж үзэх (туршиж)","synonyms_mn":["туршиж үзэх","оролдож харах"],"meaning_en":"(after a reduplicated verb) to try and see","note_mn":"Үйл үгийн давталтын дараа: 试试看, 想想看, 问问看. Монголоор «-ж үз».",
   "examples":[{"zh":"你尝尝看，好吃吗？","pinyin":"Nǐ chángchang kàn, hǎochī ma?","mn":"Амсаж үз л дээ, амттай юу?"},{"zh":"我问问看他有没有时间。","pinyin":"Wǒ wènwen kàn tā yǒu méiyǒu shíjiān.","mn":"Түүнээс цаг байгаа эсэхийг асууж үзье."}]}
 ]}
$j$::jsonb, 'reviewed', 'teacher');

select public.dictionary_upsert_from_json('好', '1', $j$
{"register":"хоёулаа","measure_words":[],"confusable_with":["行","棒","不错"],
 "usage_note_mn":"好 нь тэмдэг нэр (сайн), үйл үгийн өмнө «хялбар» (好学 сурахад амархан), үйл үгийн дараа «дууссан, бэлэн» (做好 хийж дууссан), мөн «маш» гэсэн чангаруулах үг (好大 маш том). Утгыг байрлалаар нь ялга.",
 "collocations":[{"zh":"好吃","pinyin":"hǎochī","mn":"амттай"},{"zh":"好看","pinyin":"hǎokàn","mn":"үзэсгэлэнтэй, гоё"},{"zh":"好久","pinyin":"hǎojiǔ","mn":"удаан, их удаан"},{"zh":"好像","pinyin":"hǎoxiàng","mn":"юм шиг, бололтой"},{"zh":"准备好","pinyin":"zhǔnbèi hǎo","mn":"бэлэн болох"}],
 "senses":[
  {"pos":"a","gloss_zh":"优点多的；使人满意的","meaning_mn":"сайн","synonyms_mn":["сайхан","зүгээр","дээр","чанартай","гоё (ярианы)"],"meaning_en":"good; fine; nice","note_mn":"",
   "examples":[{"zh":"今天天气很好。","pinyin":"Jīntiān tiānqì hěn hǎo.","mn":"Өнөөдөр цаг агаар сайхан байна."},{"zh":"他是个好人。","pinyin":"Tā shì ge hǎo rén.","mn":"Тэр сайн хүн."}]},
  {"pos":"a","gloss_zh":"身体健康；疾病痊愈","meaning_mn":"эдгэрсэн, бие сайн","synonyms_mn":["эдгэх","илааршрах","сайжрах","эрүүл"],"meaning_en":"well; recovered","note_mn":"病好了 = өвчин эдгэрлээ.",
   "examples":[{"zh":"你的病好了吗？","pinyin":"Nǐ de bìng hǎo le ma?","mn":"Өвчин чинь эдгэрэв үү?"},{"zh":"休息两天就好了。","pinyin":"Xiūxi liǎng tiān jiù hǎo le.","mn":"Хоёр хоног амрахаар л зүгээр болно."}]},
  {"pos":"a","gloss_zh":"用在动词后，表示完成或达到完善的地步","meaning_mn":"(үйл) дууссан, бэлэн болсон","synonyms_mn":["бэлэн","дуусах","бүтэх","болох"],"meaning_en":"(after a verb) done; ready; completed","note_mn":"Үр дүнгийн нэмэлт: 做好, 写好, 准备好. Монголоор «-ж дуусах, бэлэн болох».",
   "examples":[{"zh":"饭做好了，快来吃。","pinyin":"Fàn zuò hǎo le, kuài lái chī.","mn":"Хоол болсон, хурдан ир."},{"zh":"作业我都写好了。","pinyin":"Zuòyè wǒ dōu xiě hǎo le.","mn":"Гэрийн даалгавраа бүгдийг хийж дууслаа."}]},
  {"pos":"a","gloss_zh":"容易","meaning_mn":"(хийхэд) амархан, хялбар","synonyms_mn":["амархан","хялбар","дөхөм","төвөггүй"],"meaning_en":"easy to","note_mn":"Үйл үгийн өмнө: 好学 сурахад амархан, 好办 хийхэд амархан. Эсрэг нь 难.",
   "examples":[{"zh":"汉语不太好学。","pinyin":"Hànyǔ bú tài hǎo xué.","mn":"Хятад хэл сурахад тийм ч амар биш."},{"zh":"这个问题好办。","pinyin":"Zhège wèntí hǎo bàn.","mn":"Энэ асуудлыг шийдэх амархан."}]},
  {"pos":"d","gloss_zh":"很；非常（表示程度深）","meaning_mn":"маш, их","synonyms_mn":["их","маш","нэн","хэчнээн"],"meaning_en":"very; so (intensifier)","note_mn":"Сэтгэл хөдлөлтэй чангаруулал, ярианы: 好大 маш том, 好漂亮 ямар гоё юм бэ.",
   "examples":[{"zh":"今天好冷啊！","pinyin":"Jīntiān hǎo lěng a!","mn":"Өнөөдөр ямар хүйтэн юм бэ!"},{"zh":"好久不见！","pinyin":"Hǎojiǔ bú jiàn!","mn":"Удаан уулзсангүй шүү!"}]},
  {"pos":"int","gloss_zh":"表示同意、赞许或结束","meaning_mn":"за, болж байна","synonyms_mn":["за","тэгье","болно","зүгээр","ок (ярианы)"],"meaning_en":"OK; all right; good","note_mn":"Зөвшөөрөл, дуусгавар: 好，我们走吧.",
   "examples":[{"zh":"好，我们明天见。","pinyin":"Hǎo, wǒmen míngtiān jiàn.","mn":"За, маргааш уулзъя."},{"zh":"好了好了，别说了。","pinyin":"Hǎo le hǎo le, bié shuō le.","mn":"За за, боль."}]}
 ]}
$j$::jsonb, 'reviewed', 'teacher');

select public.dictionary_upsert_from_json('打', '2', $j$
{"register":"хоёулаа","measure_words":[],"confusable_with":["做","玩","敲"],
 "usage_note_mn":"打 нь хятад хэлний хамгийн олон утгатай үйл үгийн нэг. Үндсэн утга «цохих» боловч бөмбөг тоглох, утасдах, такси барих, зүү тариулах зэрэг олон хэллэгт «ерөнхий үйл үг» болж ордог. Монголоор утга бүрт тусдаа үйл үг хэрэглэ — хэзээ ч «цохих» гэж бүү калькал.",
 "collocations":[{"zh":"打电话","pinyin":"dǎ diànhuà","mn":"утасдах"},{"zh":"打篮球","pinyin":"dǎ lánqiú","mn":"сагс тоглох"},{"zh":"打车","pinyin":"dǎchē","mn":"такси барих"},{"zh":"打针","pinyin":"dǎzhēn","mn":"тариа хийлгэх"},{"zh":"打算","pinyin":"dǎsuàn","mn":"бодож байна, төлөвлөх"}],
 "senses":[
  {"pos":"v","gloss_zh":"用手或器具撞击物体","meaning_mn":"цохих, зодох","synonyms_mn":["цохих","дэлдэх","зодох","балбах","нүдэх"],"meaning_en":"to hit; to strike; to beat","note_mn":"",
   "examples":[{"zh":"别打人！","pinyin":"Bié dǎ rén!","mn":"Хүн зодож болохгүй!"},{"zh":"他打了一下桌子。","pinyin":"Tā dǎ le yíxià zhuōzi.","mn":"Тэр ширээг нэг цохилоо."}]},
  {"pos":"v","gloss_zh":"进行某种球类运动或游戏","meaning_mn":"(бөмбөг, тоглоом) тоглох","synonyms_mn":["тоглох","наадах","тоглолт хийх"],"meaning_en":"to play (ball games, cards)","note_mn":"Гараар тоглодог спортод 打 (сагс, ширээний теннис, хөзөр); хөлөөр бол 踢 (хөлбөмбөг).",
   "examples":[{"zh":"我们周末去打篮球吧。","pinyin":"Wǒmen zhōumò qù dǎ lánqiú ba.","mn":"Амралтын өдөр сагс тоглоцгооё."},{"zh":"爷爷喜欢打牌。","pinyin":"Yéye xǐhuan dǎ pái.","mn":"Өвөө хөзөр тоглох дуртай."}]},
  {"pos":"v","gloss_zh":"拨打（电话）","meaning_mn":"утасдах","synonyms_mn":["утасдах","залгах","утсаар ярих","холбогдох"],"meaning_en":"to make (a phone call)","note_mn":"打电话 — утасдах; 给…打电话 — хэн нэгэнд утасдах.",
   "examples":[{"zh":"晚上我给你打电话。","pinyin":"Wǎnshang wǒ gěi nǐ dǎ diànhuà.","mn":"Орой чамд утасдана."},{"zh":"刚才谁打电话来了？","pinyin":"Gāngcái shéi dǎ diànhuà lái le?","mn":"Сая хэн утасдав?"}]},
  {"pos":"v","gloss_zh":"乘坐（出租车）","meaning_mn":"(такси) барих","synonyms_mn":["барих","дуудах","суух"],"meaning_en":"to take (a taxi)","note_mn":"打车 / 打的 — такси барих. Автобус бол 坐.",
   "examples":[{"zh":"太晚了，我们打车回去吧。","pinyin":"Tài wǎn le, wǒmen dǎchē huíqu ba.","mn":"Орой болчихлоо, такси бариад харья."},{"zh":"从这儿打车到机场要多少钱？","pinyin":"Cóng zhèr dǎchē dào jīchǎng yào duōshao qián?","mn":"Эндээс онгоцны буудал хүртэл таксинд хэд төлөх вэ?"}]},
  {"pos":"v","gloss_zh":"注射","meaning_mn":"(тариа) хийх, хийлгэх","synonyms_mn":["тариулах","тариа хийлгэх","зүү тавих"],"meaning_en":"to inject; to get a shot","note_mn":"打针 — тариа хийлгэх; 打疫苗 — вакцин хийлгэх.",
   "examples":[{"zh":"孩子今天去打针了。","pinyin":"Háizi jīntiān qù dǎzhēn le.","mn":"Хүүхэд өнөөдөр тариа хийлгэлээ."},{"zh":"我有点怕打针。","pinyin":"Wǒ yǒudiǎn pà dǎzhēn.","mn":"Би тариагаас жаахан айдаг."}]}
 ]}
$j$::jsonb, 'reviewed', 'teacher');

select public.dictionary_upsert_from_json('开', '1', $j$
{"register":"хоёулаа","measure_words":[],"confusable_with":["关","打开","启"],
 "usage_note_mn":"开 нь «онгойлгох»-оос эхлээд «асаах», «жолоодох», «нээх (дэлгүүр, хурал)», «цэцэглэх» хүртэл өргөн. Эсрэг үг нь 关 (хаах, унтраах). Монголоор объектоос нь хамаарч үйл үгийг сонго: хаалга онгойлгох, гэрэл асаах, машин жолоодох, хурал хийх.",
 "collocations":[{"zh":"开门","pinyin":"kāi mén","mn":"хаалга онгойлгох; (дэлгүүр) онгойх"},{"zh":"开车","pinyin":"kāichē","mn":"машин барих, жолоодох"},{"zh":"开会","pinyin":"kāihuì","mn":"хурал хийх, хуралд суух"},{"zh":"开始","pinyin":"kāishǐ","mn":"эхлэх"},{"zh":"开玩笑","pinyin":"kāi wánxiào","mn":"тоглоом хийх, шоглох"}],
 "senses":[
  {"pos":"v","gloss_zh":"使关闭着的东西不再关闭","meaning_mn":"онгойлгох, нээх","synonyms_mn":["онгойлгох","нээх","татах","задлах"],"meaning_en":"to open","note_mn":"Хаалга, цонх, хайрцаг, ном.",
   "examples":[{"zh":"请开一下门。","pinyin":"Qǐng kāi yíxià mén.","mn":"Хаалгаа онгойлгож өгөөч."},{"zh":"太热了，把窗户开开吧。","pinyin":"Tài rè le, bǎ chuānghu kāikai ba.","mn":"Халуун байна, цонхоо онгойлгоё."}]},
  {"pos":"v","gloss_zh":"使机器、电器等运转","meaning_mn":"асаах, ажиллуулах","synonyms_mn":["асаах","залгах","ажиллуулах","явуулах"],"meaning_en":"to turn on; to switch on","note_mn":"Гэрэл, зурагт, компьютер, агааржуулагч. Эсрэг нь 关.",
   "examples":[{"zh":"天黑了，开灯吧。","pinyin":"Tiān hēi le, kāi dēng ba.","mn":"Харанхуй болчихлоо, гэрэл асаая."},{"zh":"你开一下空调。","pinyin":"Nǐ kāi yíxià kōngtiáo.","mn":"Агааржуулагчаа асаагаач."}]},
  {"pos":"v","gloss_zh":"驾驭车辆","meaning_mn":"(машин) барих, жолоодох","synonyms_mn":["жолоодох","барих","унах","хөдөлгөх"],"meaning_en":"to drive (a vehicle)","note_mn":"开车 — машин жолоодох. Онгоц ч 开飞机.",
   "examples":[{"zh":"我不会开车。","pinyin":"Wǒ bú huì kāichē.","mn":"Би машин барьж чадахгүй."},{"zh":"他开车开得很快。","pinyin":"Tā kāichē kāi de hěn kuài.","mn":"Тэр машин хурдан барьдаг."}]},
  {"pos":"v","gloss_zh":"举行（会议等）；创办","meaning_mn":"(хурал) хийх; (дэлгүүр, компани) нээх","synonyms_mn":["зохион байгуулах","хийх","нээх","байгуулах","ажил эхлүүлэх"],"meaning_en":"to hold (a meeting); to open (a shop); to start (a business)","note_mn":"开会 хурал хийх, 开店 дэлгүүр нээх, 开公司 компани байгуулах.",
   "examples":[{"zh":"下午三点开会。","pinyin":"Xiàwǔ sān diǎn kāihuì.","mn":"Үдээс хойш 3 цагт хурал."},{"zh":"他在北京开了一家饭馆。","pinyin":"Tā zài Běijīng kāi le yì jiā fànguǎn.","mn":"Тэр Бээжинд нэг гуанз нээсэн."}]},
  {"pos":"v","gloss_zh":"（花）绽放；（水）沸腾","meaning_mn":"(цэцэг) дэлгэрэх; (ус) буцлах","synonyms_mn":["дэлгэрэх","цэцэглэх","буцлах","оргилох"],"meaning_en":"(of flowers) to bloom; (of water) to boil","note_mn":"花开了 цэцэг дэлгэрлээ; 水开了 ус буцаллаа.",
   "examples":[{"zh":"春天来了，花都开了。","pinyin":"Chūntiān lái le, huā dōu kāi le.","mn":"Хавар ирж, цэцэг бүгд дэлгэрлээ."},{"zh":"水开了，可以泡茶了。","pinyin":"Shuǐ kāi le, kěyǐ pào chá le.","mn":"Ус буцаллаа, цай чанаж болно."}]}
 ]}
$j$::jsonb, 'reviewed', 'teacher');

select public.dictionary_upsert_from_json('意思', '2', $j$
{"register":"хоёулаа","measure_words":["个","点"],"confusable_with":["意义","想法","意见"],
 "usage_note_mn":"意思 нь «утга»-аас гадна «санаа, бодол», «сонирхолтой байдал» (有意思), «бэлэг болгон өгсөн бяцхан зүйл» (小意思), «ичих» (不好意思) зэрэг олон хэллэгт ордог. 意义 нь «ач холбогдол» гэсэн илүү хүнд үг — андуурч болохгүй.",
 "collocations":[{"zh":"有意思","pinyin":"yǒu yìsi","mn":"сонирхолтой, сонин"},{"zh":"没意思","pinyin":"méi yìsi","mn":"уйтгартай, сонингүй"},{"zh":"不好意思","pinyin":"bù hǎoyìsi","mn":"уучлаарай; ичмээр юм"},{"zh":"什么意思","pinyin":"shénme yìsi","mn":"ямар утгатай вэ; юу гэсэн үг вэ"},{"zh":"小意思","pinyin":"xiǎo yìsi","mn":"жижиг зүйл, өчүүхэн бэлэг"}],
 "senses":[
  {"pos":"n","gloss_zh":"语言文字等的意义","meaning_mn":"утга","synonyms_mn":["утга","агуулга","учир","санаа"],"meaning_en":"meaning; sense","note_mn":"",
   "examples":[{"zh":"这个词是什么意思？","pinyin":"Zhège cí shì shénme yìsi?","mn":"Энэ үг ямар утгатай вэ?"},{"zh":"我不明白你的意思。","pinyin":"Wǒ bù míngbai nǐ de yìsi.","mn":"Би чиний юу хэлэх гээд байгааг ойлгохгүй байна."}]},
  {"pos":"n","gloss_zh":"意见；想法","meaning_mn":"санаа, бодол","synonyms_mn":["санаа","бодол","санал","хүсэл","зорилго"],"meaning_en":"idea; opinion; intention","note_mn":"你的意思是…？ — Чи …гэж байна уу?",
   "examples":[{"zh":"我的意思是明天再去。","pinyin":"Wǒ de yìsi shì míngtiān zài qù.","mn":"Би маргааш явъя гэж байгаа юм."},{"zh":"这是我的一点意思，请收下。","pinyin":"Zhè shì wǒ de yìdiǎn yìsi, qǐng shōuxià.","mn":"Энэ миний бяцхан бэлэг, аваарай."}]},
  {"pos":"n","gloss_zh":"趣味","meaning_mn":"сонирхол, сонин","synonyms_mn":["сонирхолтой","сонин","хөгжилтэй","амттай (ярианы)"],"meaning_en":"interest; fun","note_mn":"Үргэлж 有/没-тэй: 有意思 сонирхолтой, 没意思 уйтгартай.",
   "examples":[{"zh":"这本书很有意思。","pinyin":"Zhè běn shū hěn yǒu yìsi.","mn":"Энэ ном их сонирхолтой."},{"zh":"一个人在家没意思。","pinyin":"Yí ge rén zài jiā méi yìsi.","mn":"Гэртээ ганцаараа байх уйтгартай."}]}
 ]}
$j$::jsonb, 'reviewed', 'teacher');

select public.dictionary_upsert_from_json('方便', '3', $j$
{"register":"хоёулаа","measure_words":[],"confusable_with":["便利","容易","顺便"],
 "usage_note_mn":"方便 нь «тухтай, дөхөм» гэсэн тэмдэг нэр, «тухтай болгох» үйл үг, мөн эелдэг хэллэгт «бие засах» (去方便一下). Монголоор нөхцөл байдлаас хамаарч «амар, дөхөм, тухтай, боломжтой» гэж янз бүрээр орчуулна.",
 "collocations":[{"zh":"方便面","pinyin":"fāngbiànmiàn","mn":"бэлэн гоймон"},{"zh":"交通方便","pinyin":"jiāotōng fāngbiàn","mn":"зам тээвэр дөхөм"},{"zh":"不方便","pinyin":"bù fāngbiàn","mn":"боломжгүй, эвгүй"},{"zh":"方便的时候","pinyin":"fāngbiàn de shíhou","mn":"боломжтой үедээ, завтай үедээ"}],
 "senses":[
  {"pos":"a","gloss_zh":"便利；没有困难","meaning_mn":"дөхөм, тухтай","synonyms_mn":["дөхөм","тухтай","амар","ойрхон","хялбар"],"meaning_en":"convenient","note_mn":"",
   "examples":[{"zh":"这儿交通很方便。","pinyin":"Zhèr jiāotōng hěn fāngbiàn.","mn":"Энд зам тээвэр дөхөм."},{"zh":"用手机付钱很方便。","pinyin":"Yòng shǒujī fù qián hěn fāngbiàn.","mn":"Утсаар төлбөр хийх их амар."}]},
  {"pos":"a","gloss_zh":"适宜；有时间","meaning_mn":"боломжтой, завтай","synonyms_mn":["боломжтой","завтай","тохиромжтой","зүгээр"],"meaning_en":"suitable; free (to do sth)","note_mn":"Эелдэг асуулт: 你现在方便吗？ — Одоо боломжтой юу?",
   "examples":[{"zh":"你现在方便吗？我想问个问题。","pinyin":"Nǐ xiànzài fāngbiàn ma? Wǒ xiǎng wèn ge wèntí.","mn":"Одоо боломжтой юу? Нэг юм асуумаар байна."},{"zh":"如果不方便，就明天再说。","pinyin":"Rúguǒ bù fāngbiàn, jiù míngtiān zài shuō.","mn":"Боломжгүй бол маргааш ярилцъя."}]},
  {"pos":"v","gloss_zh":"使便利","meaning_mn":"дөхөм болгох, хялбарчлах","synonyms_mn":["дөхөм болгох","хялбарчлах","амар болгох"],"meaning_en":"to make convenient; to facilitate","note_mn":"",
   "examples":[{"zh":"这个软件方便了大家的生活。","pinyin":"Zhège ruǎnjiàn fāngbiàn le dàjiā de shēnghuó.","mn":"Энэ программ хүмүүсийн амьдралыг амар болгосон."},{"zh":"为了方便学生，学校开了晚班车。","pinyin":"Wèile fāngbiàn xuésheng, xuéxiào kāi le wǎn bānchē.","mn":"Оюутнуудад дөхөм болгож сургууль оройн автобус явуулдаг болсон."}]},
  {"pos":"v","gloss_zh":"婉辞，指排泄大小便","meaning_mn":"бие засах (эелдэг)","synonyms_mn":["бие засах","жорлон орох","гарах"],"meaning_en":"(euphemism) to go to the toilet","note_mn":"Зөвхөн эелдэг ярианд: 我去方便一下.",
   "examples":[{"zh":"对不起，我去方便一下。","pinyin":"Duìbuqǐ, wǒ qù fāngbiàn yíxià.","mn":"Уучлаарай, би жаахан гараад ирье."},{"zh":"请问哪儿可以方便一下？","pinyin":"Qǐngwèn nǎr kěyǐ fāngbiàn yíxià?","mn":"Уучлаарай, бие засах газар хаана байна?"}]}
 ]}
$j$::jsonb, 'reviewed', 'teacher');

select public.dictionary_upsert_from_json('热', '1', $j$
{"register":"хоёулаа","measure_words":[],"confusable_with":["烫","暑","火"],
 "usage_note_mn":"热 нь цаг агаар, биет зүйлийн «халуун», хоол «халаах» үйл үг, мөн «халуун дулаан (сэтгэл)», «эрэлттэй, моод» (热门) гэсэн шилжсэн утгатай. 烫 бол «халуун тусах, түлэх» хэмжээний халуун.",
 "collocations":[{"zh":"天气热","pinyin":"tiānqì rè","mn":"цаг агаар халуун"},{"zh":"热水","pinyin":"rè shuǐ","mn":"халуун ус"},{"zh":"热情","pinyin":"rèqíng","mn":"халуун дотно, элэгсэг"},{"zh":"热闹","pinyin":"rènao","mn":"хөл ихтэй, хөгжөөнтэй"},{"zh":"热门","pinyin":"rèmén","mn":"эрэлттэй, моод"}],
 "senses":[
  {"pos":"a","gloss_zh":"温度高","meaning_mn":"халуун","synonyms_mn":["халуун","бүгчим","дулаан","шатам халуун","аагим"],"meaning_en":"hot (temperature, weather)","note_mn":"",
   "examples":[{"zh":"今天太热了。","pinyin":"Jīntiān tài rè le.","mn":"Өнөөдөр дэндүү халуун байна."},{"zh":"小心，汤很热。","pinyin":"Xiǎoxīn, tāng hěn rè.","mn":"Болгоомжтой, шөл халуун."}]},
  {"pos":"v","gloss_zh":"使温度升高；加热","meaning_mn":"халаах","synonyms_mn":["халаах","бүлээцүүлэх","дулаацуулах","хөөх"],"meaning_en":"to heat up; to warm up","note_mn":"热一热 / 热一下 — жаахан халаах.",
   "examples":[{"zh":"饭凉了，我去热一下。","pinyin":"Fàn liáng le, wǒ qù rè yíxià.","mn":"Хоол хөрчихсөн, жаахан халаая."},{"zh":"把牛奶热热再喝。","pinyin":"Bǎ niúnǎi rère zài hē.","mn":"Сүүгээ халаагаад уу."}]},
  {"pos":"a","gloss_zh":"情意深厚；热烈","meaning_mn":"халуун дотно; халуун (сэтгэл)","synonyms_mn":["дотно","элэгсэг","халуун сэтгэлтэй","уриалгахан"],"meaning_en":"warm (feelings); ardent","note_mn":"热心 халуун сэтгэлтэй, 热爱 халуунаар хайрлах.",
   "examples":[{"zh":"他对人很热情。","pinyin":"Tā duì rén hěn rèqíng.","mn":"Тэр хүмүүст их элэгсэг."},{"zh":"大家热烈欢迎新老师。","pinyin":"Dàjiā rèliè huānyíng xīn lǎoshī.","mn":"Бүгд шинэ багшийг халуун дотноор угтлаа."}]},
  {"pos":"a","gloss_zh":"受很多人欢迎的","meaning_mn":"эрэлттэй, моод","synonyms_mn":["моод","эрэлттэй","алдартай","халуун сэдэв"],"meaning_en":"popular; in demand","note_mn":"热门 — моод; 热点 — халуун сэдэв.",
   "examples":[{"zh":"这是今年最热门的手机。","pinyin":"Zhè shì jīnnián zuì rèmén de shǒujī.","mn":"Энэ бол энэ жилийн хамгийн эрэлттэй утас."},{"zh":"环境问题是现在的热点。","pinyin":"Huánjìng wèntí shì xiànzài de rèdiǎn.","mn":"Байгаль орчны асуудал одоо халуун сэдэв болсон."}]}
 ]}
$j$::jsonb, 'reviewed', 'teacher');

select public.dictionary_upsert_from_json('认识', '1', $j$
{"register":"хоёулаа","measure_words":[],"confusable_with":["知道","了解","熟悉"],
 "usage_note_mn":"认识 = хүн, газар, ханзыг «таних, мэдэх» (нүүр царайгаар нь); 知道 = мэдээлэл мэдэх; 了解 = гүн ойлгох. «Би түүнийг таньдаг» → 认识, «Би түүний тухай мэднэ» → 知道.",
 "collocations":[{"zh":"认识你很高兴","pinyin":"rènshi nǐ hěn gāoxìng","mn":"тантай танилцсандаа баяртай байна"},{"zh":"认识汉字","pinyin":"rènshi Hànzì","mn":"ханз таних, мэдэх"},{"zh":"互相认识","pinyin":"hùxiāng rènshi","mn":"бие биетэйгээ танилцах"},{"zh":"认识到","pinyin":"rènshi dào","mn":"ухаарах, ойлгож мэдэх"}],
 "senses":[
  {"pos":"v","gloss_zh":"能够确定某一人或事物是这个而不是别的","meaning_mn":"таних, мэдэх","synonyms_mn":["таних","мэдэх","нүүр таних","дотно биш танил байх"],"meaning_en":"to know (a person); to recognize","note_mn":"Хүн, газар, үг: 我认识他 — би түүнийг таньдаг.",
   "examples":[{"zh":"你认识这个人吗？","pinyin":"Nǐ rènshi zhège rén ma?","mn":"Чи энэ хүнийг таних уу?"},{"zh":"这个字我不认识。","pinyin":"Zhège zì wǒ bú rènshi.","mn":"Энэ ханзыг би мэдэхгүй."}]},
  {"pos":"v","gloss_zh":"相识；结识","meaning_mn":"танилцах","synonyms_mn":["танилцах","танил болох","нөхөрлөх","уулзаж танилцах"],"meaning_en":"to get to know; to become acquainted","note_mn":"Шинэ хүнтэй: 认识你很高兴.",
   "examples":[{"zh":"认识你很高兴！","pinyin":"Rènshi nǐ hěn gāoxìng!","mn":"Тантай танилцсандаа баяртай байна!"},{"zh":"我们是在大学认识的。","pinyin":"Wǒmen shì zài dàxué rènshi de.","mn":"Бид их сургуульд танилцсан юм."}]},
  {"pos":"n","gloss_zh":"指人的头脑对客观世界的反映","meaning_mn":"ойлголт, мэдлэг","synonyms_mn":["ойлголт","таних мэдэх","ухаарал","төсөөлөл"],"meaning_en":"understanding; knowledge; awareness","note_mn":"Нэр үг болохоороо HSK 4+ түвшинд: 对…的认识 — …-ийн тухай ойлголт.",
   "examples":[{"zh":"我对中国文化的认识还很少。","pinyin":"Wǒ duì Zhōngguó wénhuà de rènshi hái hěn shǎo.","mn":"Хятадын соёлын тухай миний ойлголт одоохондоо бага."},{"zh":"他对这个问题有新的认识。","pinyin":"Tā duì zhège wèntí yǒu xīn de rènshi.","mn":"Тэр энэ асуудлыг шинээр ойлгож авсан."}]}
 ]}
$j$::jsonb, 'reviewed', 'teacher');
