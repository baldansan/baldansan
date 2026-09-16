-- =============================================================================
-- 060 — Сонсголын асуулт бүрийн аудио хэсэг ба бичвэр
-- =============================================================================
--
-- ЯАГААД:
-- HSK 2–6-ийн загвар шалгалтуудад асуулт бүрийн `audio_url` нь тухайн
-- асуултын биш, ХЭСГИЙН бүтэн бичлэг (25–35 минут) байдаг. Зөвхөн H11329
-- дээр л асуулт бүр өөрийн клиптэй. Үүнээс болж дасгалын горимд асуулт
-- бүр дээр 30 минутын файл эхнээс нь эхэлдэг байв.
--
-- Шийдэл: файлыг хуваахгүйгээр асуулт бүрийн ЭХЛЭХ, ДУУСАХ СЕКУНДЫГ
-- хадгална. Тоглуулагч тэр хэсгээс нь эхлээд тэндээ зогсоно.
--
-- `audio_transcript` нь тухайн асуултын бичлэгийн хятад текст. Энэ нь
-- АВТОМАТААР (яриа таних загвараар) гаргасан бичвэр тул алдаа агуулж
-- болно — дэлгэц дээр үүнийг зааж өгөх ёстой. HSK-ийн албан ёсны
-- материалд сонсголын эх бичвэр (听力材料) байдаггүй тул өөр эх сурвалж
-- байхгүй.
--
-- Дахин ажиллуулахад аюулгүй.
-- =============================================================================

alter table mock_test_questions
  add column if not exists audio_start_sec numeric,
  add column if not exists audio_end_sec   numeric,
  add column if not exists audio_transcript text;

comment on column mock_test_questions.audio_start_sec is
  'Хэсгийн бүтэн бичлэг дэх энэ асуултын эхлэх секунд. null бол бүтнээр нь тоглуулна.';
comment on column mock_test_questions.audio_end_sec is
  'Энэ асуултын дуусах секунд. null бол файлын төгсгөл хүртэл.';
comment on column mock_test_questions.audio_transcript is
  'Бичлэгийн хятад текст. Яриа таних загвараар автоматаар гаргасан — алдаатай байж болно.';

-- Зөвхөн утга учиртай мужийг зөвшөөрнө.
alter table mock_test_questions
  drop constraint if exists mock_test_questions_audio_range_chk;
alter table mock_test_questions
  add constraint mock_test_questions_audio_range_chk
  check (
    audio_start_sec is null
    or audio_end_sec is null
    or audio_end_sec > audio_start_sec
  );
