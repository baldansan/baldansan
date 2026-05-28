-- Buunduu Surtsgaay — seed HSK5 Lessons 1–3 (Phase 3 Step 3)
-- Source: content/courses/hsk5/lessons/lesson-{1,2,3}.ts
-- Prerequisite: supabase/migrations/001_initial_schema.sql
-- Idempotent: upsert course/lessons; replace child rows for lessons 1–3
-- Does not modify user_* progress tables

begin;

-- Course: hsk5
insert into public.courses (id, title, description, level, status, order_index)
values (
  'hsk5', 'HSK5 Short Drama Chinese', 'Илүү гүнзгий хэллэг, subtitle, shadowing, quiz-тэй хичээлүүд.', 'HSK5', 'available', 1
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  level = excluded.level,
  status = excluded.status,
  order_index = excluded.order_index,
  updated_at = now();

-- Lesson 1
insert into public.lessons (id, course_id, title, chinese_title, subtitle, description, duration, vocabulary_count, quiz_count, status, order_index)
values (
  '1', 'hsk5', 'Lesson 1', '爱的细节', 'Хайрын жижиг деталь, халамж, ойлголцлын тухай богино хичээл.', 'Хайрын жижиг деталь, халамж, ойлголцлын тухай богино хичээл.', '8 min', 5, 5, 'available', 1
)
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  chinese_title = excluded.chinese_title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  duration = excluded.duration,
  vocabulary_count = excluded.vocabulary_count,
  quiz_count = excluded.quiz_count,
  status = excluded.status,
  order_index = excluded.order_index,
  updated_at = now();

-- Lesson 2
insert into public.lessons (id, course_id, title, chinese_title, subtitle, description, duration, vocabulary_count, quiz_count, status, order_index)
values (
  '2', 'hsk5', 'Lesson 2', '你真的懂我吗？', 'Харилцаанд ойлголцол, асуулт, сэтгэл хөдлөлийн хэллэгүүд.', 'Энэ хичээлээр харилцаанд хэрэглэгддэг асуулт, ойлголцол, мэдрэмж, тайлбарлах хэллэгүүдийг сурна.', '7 min', 12, 5, 'available', 2
)
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  chinese_title = excluded.chinese_title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  duration = excluded.duration,
  vocabulary_count = excluded.vocabulary_count,
  quiz_count = excluded.quiz_count,
  status = excluded.status,
  order_index = excluded.order_index,
  updated_at = now();

-- Lesson 3
insert into public.lessons (id, course_id, title, chinese_title, subtitle, description, duration, vocabulary_count, quiz_count, status, order_index)
values (
  '3', 'hsk5', 'Lesson 3', '我只是想照顾你', 'Халамжлах, санаа тавих, тайлбарлах үед хэрэглэгдэх өгүүлбэрүүд.', 'Энэ хичээлээр халамжлах, санаа тавих, буруу ойлголцлоо тайлбарлах үед хэрэглэгдэх бодит хэллэгүүдийг сурна.', '9 min', 12, 5, 'available', 3
)
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  chinese_title = excluded.chinese_title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  duration = excluded.duration,
  vocabulary_count = excluded.vocabulary_count,
  quiz_count = excluded.quiz_count,
  status = excluded.status,
  order_index = excluded.order_index,
  updated_at = now();

-- Remove existing child rows for lessons 1–3 (re-seed safe)
delete from public.subtitle_lines where lesson_id in ('1', '2', '3');
delete from public.vocabulary_words where lesson_id in ('1', '2', '3');
delete from public.quiz_questions where lesson_id in ('1', '2', '3');

-- Subtitles: lesson 1
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('1', '00:00', '00:03', '你真的懂我吗？', 'Nǐ zhēn de dǒng wǒ ma?', 'Чи намайг үнэхээр ойлгодог уу?', 1);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('1', '00:04', '00:07', '我只是想照顾你。', 'Wǒ zhǐshì xiǎng zhàogù nǐ.', 'Би зүгээр л чамайг халамжлахыг хүссэн.', 2);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('1', '00:08', '00:11', '可是你从来不听我的感受。', 'Kěshì nǐ cónglái bù tīng wǒ de gǎnshòu.', 'Гэхдээ чи миний мэдрэмжийг хэзээ ч сонсдоггүй.', 3);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('1', '00:12', '00:15', '我以为这就是爱。', 'Wǒ yǐwéi zhè jiùshì ài.', 'Би үүнийг л хайр гэж бодсон.', 4);

-- Vocabulary: lesson 1
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('1', '细节', 'xìjié', 'нарийн зүйл, жижиг деталь', 'HSK5', '爱的细节很重要。', 'Хайрын жижиг зүйлс маш чухал.', 1);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('1', '照顾', 'zhàogù', 'асрах, халамжлах', 'HSK4', '他很会照顾别人。', 'Тэр бусдыг халамжлахдаа сайн.', 2);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('1', '理解', 'lǐjiě', 'ойлгох', 'HSK4', '我希望你能理解我。', 'Чи намайг ойлгоосой гэж би хүсэж байна.', 3);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('1', '感受', 'gǎnshòu', 'мэдрэмж', 'HSK5', '你从来不听我的感受。', 'Чи миний мэдрэмжийг хэзээ ч сонсдоггүй.', 4);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('1', '以为', 'yǐwéi', 'гэж бодох, андуурах', 'HSK4', '我以为这就是爱。', 'Би үүнийг л хайр гэж бодсон.', 5);

-- Quiz: lesson 1
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('1', 'multiple_choice', '“细节” гэдэг үгийн зөв утга аль вэ?', '["нарийн зүйл, жижиг деталь","хурдан явах","маргааш уулзах","хоол хийх"]'::jsonb, 'нарийн зүйл, жижиг деталь', '“细节” нь detail буюу жижиг нарийн зүйл гэсэн утгатай.', 1);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('1', 'multiple_choice', '“照顾” гэдэг үгийн зөв утга аль вэ?', '["асрах, халамжлах","сонгох","худалдаж авах","явуулах"]'::jsonb, 'асрах, халамжлах', '“照顾” нь care for, look after гэсэн утгатай.', 2);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('1', 'cloze', '我只是想____你。', '["照顾","细节","感受","以为"]'::jsonb, '照顾', '“我只是想照顾你。” = Би зүгээр л чамайг халамжлахыг хүссэн.', 3);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('1', 'multiple_choice', '“感受” гэдэг үгийн зөв утга аль вэ?', '["мэдрэмж","үнэ","хаяг","зам"]'::jsonb, 'мэдрэмж', '“感受” нь feeling, sensation гэсэн утгатай.', 4);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('1', 'cloze', '我____这就是爱。', '["以为","理解","照顾","细节"]'::jsonb, '以为', '“我以为这就是爱。” = Би үүнийг л хайр гэж бодсон.', 5);

-- Subtitles: lesson 2
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('2', '00:00', '00:03', '你真的懂我吗？', 'Nǐ zhēn de dǒng wǒ ma?', 'Чи намайг үнэхээр ойлгодог уу?', 1);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('2', '00:04', '00:07', '我不是不在乎你。', 'Wǒ bú shì bù zàihū nǐ.', 'Би чамайг тоодоггүй гэсэн үг биш.', 2);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('2', '00:08', '00:11', '只是有时候我不知道该怎么说。', 'Zhǐshì yǒu shíhou wǒ bù zhīdào gāi zěnme shuō.', 'Зүгээр л заримдаа би юу гэж хэлэхээ мэддэггүй.', 3);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('2', '00:12', '00:15', '那你可以告诉我你的感受。', 'Nà nǐ kěyǐ gàosu wǒ nǐ de gǎnshòu.', 'Тэгвэл чи надад мэдрэмжээ хэлж болно шүү дээ.', 4);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('2', '00:16', '00:19', '我怕说出来会让你难过。', 'Wǒ pà shuō chūlái huì ràng nǐ nánguò.', 'Хэлчихвэл чамайг гомдоочих вий гэж айсан.', 5);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('2', '00:20', '00:23', '不说出来，我才更难过。', 'Bù shuō chūlái, wǒ cái gèng nánguò.', 'Хэлэхгүй байх чинь харин намайг илүү гомдоодог.', 6);

-- Vocabulary: lesson 2
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '懂', 'dǒng', 'ойлгох', 'HSK3', '你真的懂我吗？', 'Чи намайг үнэхээр ойлгодог уу?', 1);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '在乎', 'zàihū', 'тоох, санаа тавих', 'HSK5', '我不是不在乎你。', 'Би чамайг тоодоггүй гэсэн үг биш.', 2);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '有时候', 'yǒu shíhou', 'заримдаа', 'HSK3', '有时候我不知道该怎么说。', 'Заримдаа би юу гэж хэлэхээ мэддэггүй.', 3);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '该', 'gāi', 'ёстой, хэрэгтэй', 'HSK4', '我不知道该怎么说。', 'Би яаж хэлэх ёстойгоо мэдэхгүй байна.', 4);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '告诉', 'gàosu', 'хэлэх, мэдэгдэх', 'HSK3', '你可以告诉我你的感受。', 'Чи надад мэдрэмжээ хэлж болно.', 5);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '感受', 'gǎnshòu', 'мэдрэмж', 'HSK5', '告诉我你的感受。', 'Надад мэдрэмжээ хэл.', 6);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '怕', 'pà', 'айх', 'HSK3', '我怕说出来会让你难过。', 'Хэлчихвэл чамайг гомдоочих вий гэж айсан.', 7);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '说出来', 'shuō chūlái', 'ам нээж хэлэх, ил хэлэх', 'HSK4', '不说出来，我才更难过。', 'Хэлэхгүй байх чинь харин намайг илүү гомдоодог.', 8);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '让', 'ràng', 'хэн нэгнийг ямар нэг байдалд хүргэх', 'HSK4', '会让你难过。', 'Чамайг гомдоох болно.', 9);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '难过', 'nánguò', 'гуниглах, сэтгэл өвдөх, гомдох', 'HSK4', '我才更难过。', 'Би харин илүү гомдоно.', 10);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '才', 'cái', 'харин, сая, л', 'HSK4', '我才更难过。', 'Би харин илүү гомдоно.', 11);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('2', '更', 'gèng', 'илүү', 'HSK3', '我才更难过。', 'Би харин илүү их гомдоно.', 12);

-- Quiz: lesson 2
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('2', 'multiple_choice', '“在乎” гэдэг үгийн зөв утга аль вэ?', '["тоох, санаа тавих","хаалга нээх","хоол хийх","маргааш явах"]'::jsonb, 'тоох, санаа тавих', '“在乎” нь care about буюу тоох, санаа тавих гэсэн утгатай.', 1);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('2', 'multiple_choice', '“难过” гэдэг үгийн зөв утга аль вэ?', '["гуниглах, гомдох","баярлах","худалдаж авах","хурдан гүйх"]'::jsonb, 'гуниглах, гомдох', '“难过” нь sad, upset гэсэн утгатай.', 2);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('2', 'cloze', '我不是不____你。', '["在乎","难过","告诉","更"]'::jsonb, '在乎', '“我不是不在乎你。” = Би чамайг тоодоггүй гэсэн үг биш.', 3);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('2', 'cloze', '你可以____我你的感受。', '["告诉","怕","懂","才"]'::jsonb, '告诉', '“你可以告诉我你的感受。” = Чи надад мэдрэмжээ хэлж болно.', 4);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('2', 'multiple_choice', '“我怕说出来会让你难过。” өгүүлбэрийн хамгийн зөв Монгол утга аль вэ?', '["Хэлчихвэл чамайг гомдоочих вий гэж айсан.","Би одоо хоол хийж байна.","Чи маргааш ирэх үү?","Энэ үнэ хэтэрхий өндөр байна."]'::jsonb, 'Хэлчихвэл чамайг гомдоочих вий гэж айсан.', 'Энэ өгүүлбэрт “怕” = айх, “说出来” = ил хэлэх, “难过” = гомдох гэсэн утгатай.', 5);

-- Subtitles: lesson 3
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('3', '00:00', '00:03', '我只是想照顾你。', 'Wǒ zhǐshì xiǎng zhàogù nǐ.', 'Би зүгээр л чамайг халамжлахыг хүссэн.', 1);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('3', '00:04', '00:07', '可是你从来没有问过我想要什么。', 'Kěshì nǐ cónglái méiyǒu wèn guò wǒ xiǎng yào shénme.', 'Гэхдээ чи надаас юу хүсэж байгааг минь хэзээ ч асууж байгаагүй.', 2);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('3', '00:08', '00:11', '我以为你会喜欢。', 'Wǒ yǐwéi nǐ huì xǐhuan.', 'Чамд таалагдана гэж би бодсон.', 3);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('3', '00:12', '00:15', '你以为的，不一定是我需要的。', 'Nǐ yǐwéi de, bù yídìng shì wǒ xūyào de.', 'Чиний бодсон зүйл заавал надад хэрэгтэй зүйл биш.', 4);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('3', '00:16', '00:19', '那我以后会先问你。', 'Nà wǒ yǐhòu huì xiān wèn nǐ.', 'Тэгвэл би дараа нь эхлээд чамаас асууж байя.', 5);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('3', '00:20', '00:23', '我需要的不是安排，而是尊重。', 'Wǒ xūyào de bú shì ānpái, ér shì zūnzhòng.', 'Надад хэрэгтэй зүйл бол зохицуулалт биш, харин хүндлэл.', 6);

-- Vocabulary: lesson 3
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '只是', 'zhǐshì', 'зүгээр л, зөвхөн', 'HSK4', '我只是想照顾你。', 'Би зүгээр л чамайг халамжлахыг хүссэн.', 1);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '照顾', 'zhàogù', 'асрах, халамжлах', 'HSK4', '我只是想照顾你。', 'Би зүгээр л чамайг халамжлахыг хүссэн.', 2);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '从来', 'cónglái', 'ерөөсөө, хэзээ ч', 'HSK5', '你从来没有问过我。', 'Чи надаас хэзээ ч асууж байгаагүй.', 3);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '问过', 'wèn guò', 'асууж байсан', 'HSK4', '你没有问过我想要什么。', 'Чи миний юу хүсэж байгааг асууж байгаагүй.', 4);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '以为', 'yǐwéi', 'гэж бодох, андуурах', 'HSK4', '我以为你会喜欢。', 'Чамд таалагдана гэж би бодсон.', 5);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '不一定', 'bù yídìng', 'заавал тийм биш', 'HSK4', '不一定是我需要的。', 'Заавал миний хэрэгтэй зүйл биш.', 6);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '需要', 'xūyào', 'хэрэгтэй байх, хэрэгцээтэй', 'HSK3', '我需要的是尊重。', 'Надад хэрэгтэй зүйл бол хүндлэл.', 7);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '以后', 'yǐhòu', 'цаашдаа, дараа нь', 'HSK3', '我以后会先问你。', 'Би цаашдаа эхлээд чамаас асууна.', 8);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '先', 'xiān', 'эхлээд, түрүүлж', 'HSK3', '我会先问你。', 'Би эхлээд чамаас асууна.', 9);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '安排', 'ānpái', 'зохицуулалт, төлөвлөх', 'HSK4', '我需要的不是安排。', 'Надад хэрэгтэй зүйл зохицуулалт биш.', 10);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '而是', 'ér shì', 'харин, харин бол', 'HSK5', '不是安排，而是尊重。', 'Зохицуулалт биш, харин хүндлэл.', 11);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('3', '尊重', 'zūnzhòng', 'хүндлэх, хүндлэл', 'HSK5', '我需要的是尊重。', 'Надад хэрэгтэй зүйл бол хүндлэл.', 12);

-- Quiz: lesson 3
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('3', 'multiple_choice', '“照顾” гэдэг үгийн зөв утга аль вэ?', '["асрах, халамжлах","худалдаж авах","явуулах","мартах"]'::jsonb, 'асрах, халамжлах', '“照顾” нь care for, look after буюу асрах, халамжлах гэсэн утгатай.', 1);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('3', 'multiple_choice', '“尊重” гэдэг үгийн зөв утга аль вэ?', '["хүндлэх, хүндлэл","инээх","асуух","яарах"]'::jsonb, 'хүндлэх, хүндлэл', '“尊重” нь respect буюу хүндлэл гэсэн утгатай.', 2);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('3', 'cloze', '我只是想____你。', '["照顾","安排","尊重","从来"]'::jsonb, '照顾', '“我只是想照顾你。” = Би зүгээр л чамайг халамжлахыг хүссэн.', 3);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('3', 'cloze', '你____的，不一定是我需要的。', '["以为","以后","先","只是"]'::jsonb, '以为', '“你以为的，不一定是我需要的。” = Чиний бодсон зүйл заавал надад хэрэгтэй зүйл биш.', 4);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('3', 'multiple_choice', '“我需要的不是安排，而是尊重。” өгүүлбэрийн хамгийн зөв Монгол утга аль вэ?', '["Надад хэрэгтэй зүйл бол зохицуулалт биш, харин хүндлэл.","Би маргааш чамтай уулзана.","Энэ хоол маш амттай байна.","Чи надаас хэзээ ч асуугаагүй."]'::jsonb, 'Надад хэрэгтэй зүйл бол зохицуулалт биш, харин хүндлэл.', '“不是……而是……” бүтэц нь “... биш, харин ...” гэсэн утгатай.', 5);

commit;

-- Expected row counts after seed:
-- courses: 1
-- lessons: 3
-- subtitle_lines: 16 (lesson 1: 4, lesson 2: 6, lesson 3: 6)
-- vocabulary_words: 29 (lesson 1: 5, lesson 2: 12, lesson 3: 12)
-- quiz_questions: 15 (5 per lesson)
