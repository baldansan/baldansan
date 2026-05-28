-- Buunduu Surtsgaay — seed HSK5 Lesson 4 (Phase 3 Step 6)
-- Supabase-first test lesson (no local TypeScript content file)
-- Prerequisite: 001_initial_schema.sql and course hsk5 (from 001_seed_hsk5_lessons.sql)
-- Idempotent: upsert lesson 4; replace child rows for lesson 4 only
-- Does not modify lessons 1–3 or user_* progress tables

begin;

-- Lesson 4
insert into public.lessons (id, course_id, title, chinese_title, subtitle, description, duration, vocabulary_count, quiz_count, status, order_index)
values (
  '4',
  'hsk5',
  'Lesson 4',
  '你为什么不说？',
  'Яагаад хэлээгүй юм бэ? гэсэн харилцааны бодит хэллэгүүд.',
  'Энэ хичээлээр асуух, тайлбарлах, гомдол илэрхийлэх, буруу ойлголцлыг засах үед хэрэглэгдэх хятад хэллэгүүдийг сурна.',
  '8 min',
  10,
  5,
  'available',
  4
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

-- Remove existing child rows for lesson 4 only (re-seed safe)
delete from public.subtitle_lines where lesson_id = '4';
delete from public.vocabulary_words where lesson_id = '4';
delete from public.quiz_questions where lesson_id = '4';

-- Subtitles: lesson 4
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('4', '00:00', '00:03', '你为什么不说？', 'Nǐ wèishénme bù shuō?', 'Чи яагаад хэлээгүй юм бэ?', 1);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('4', '00:04', '00:07', '我以为你已经知道了。', 'Wǒ yǐwéi nǐ yǐjīng zhīdào le.', 'Чамайг аль хэдийн мэдсэн гэж би бодсон.', 2);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('4', '00:08', '00:11', '你不说，我怎么会知道？', 'Nǐ bù shuō, wǒ zěnme huì zhīdào?', 'Чи хэлэхгүй бол би яаж мэдэх юм бэ?', 3);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('4', '00:12', '00:15', '对不起，是我想得太简单了。', 'Duìbuqǐ, shì wǒ xiǎng de tài jiǎndān le.', 'Уучлаарай, би хэтэрхий амархан гэж бодчихжээ.', 4);
insert into public.subtitle_lines (lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index) values ('4', '00:16', '00:19', '以后有事我们直接说。', 'Yǐhòu yǒu shì wǒmen zhíjiē shuō.', 'Цаашдаа асуудал байвал шууд ярьж байя.', 5);

-- Vocabulary: lesson 4
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('4', '为什么', 'wèishénme', 'яагаад', 'HSK2', '你为什么不说？', 'Чи яагаад хэлээгүй юм бэ?', 1);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('4', '已经', 'yǐjīng', 'аль хэдийн', 'HSK3', '我以为你已经知道了。', 'Чамайг аль хэдийн мэдсэн гэж би бодсон.', 2);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('4', '知道', 'zhīdào', 'мэдэх', 'HSK2', '我怎么会知道？', 'Би яаж мэдэх юм бэ?', 3);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('4', '怎么会', 'zěnme huì', 'яаж тэгэх юм, яаж боломжтой гэж', 'HSK4', '我怎么会知道？', 'Би яаж мэдэх юм бэ?', 4);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('4', '对不起', 'duìbuqǐ', 'уучлаарай', 'HSK2', '对不起，是我错了。', 'Уучлаарай, миний буруу.', 5);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('4', '简单', 'jiǎndān', 'амархан, энгийн', 'HSK3', '我想得太简单了。', 'Би хэтэрхий амархан гэж бодсон.', 6);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('4', '以后', 'yǐhòu', 'цаашдаа, дараа нь', 'HSK3', '以后我们直接说。', 'Цаашдаа бид шууд ярья.', 7);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('4', '有事', 'yǒu shì', 'асуудалтай байх, юм болох', 'HSK4', '有事我们直接说。', 'Асуудал байвал шууд ярья.', 8);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('4', '直接', 'zhíjiē', 'шууд', 'HSK4', '我们直接说。', 'Бид шууд ярья.', 9);
insert into public.vocabulary_words (lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index) values ('4', '说', 'shuō', 'хэлэх, ярих', 'HSK1', '你为什么不说？', 'Чи яагаад хэлээгүй юм бэ?', 10);

-- Quiz: lesson 4
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('4', 'multiple_choice', '“为什么” гэдэг үгийн зөв утга аль вэ?', '["яагаад","хаана","хэзээ","хэн"]'::jsonb, 'яагаад', '“为什么” нь why буюу яагаад гэсэн утгатай.', 1);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('4', 'multiple_choice', '“直接” гэдэг үгийн зөв утга аль вэ?', '["шууд","удаан","маргааш","чимээгүй"]'::jsonb, 'шууд', '“直接” нь directly буюу шууд гэсэн утгатай.', 2);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('4', 'cloze', '你____不说？', '["为什么","已经","简单","以后"]'::jsonb, '为什么', '“你为什么不说？” = Чи яагаад хэлээгүй юм бэ?', 3);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('4', 'cloze', '我以为你____知道了。', '["已经","直接","有事","简单"]'::jsonb, '已经', '“我以为你已经知道了。” = Чамайг аль хэдийн мэдсэн гэж би бодсон.', 4);
insert into public.quiz_questions (lesson_id, type, question, options, correct_answer, explanation, order_index) values ('4', 'multiple_choice', '“以后有事我们直接说。” өгүүлбэрийн зөв Монгол утга аль вэ?', '["Цаашдаа асуудал байвал шууд ярьж байя.","Би одоо гэртээ харина.","Энэ хоол амттай байна.","Чи хаанаас ирсэн бэ?"]'::jsonb, 'Цаашдаа асуудал байвал шууд ярьж байя.', '“以后” = цаашдаа, “有事” = асуудал байвал, “直接说” = шууд ярья.', 5);

commit;

-- Expected row counts for lesson 4:
-- lessons: 4 total (ids 1–4)
-- subtitle_lines lesson 4: 5
-- vocabulary_words lesson 4: 10
-- quiz_questions lesson 4: 5
