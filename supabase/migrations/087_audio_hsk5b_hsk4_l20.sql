-- =============================================================================
-- 087 — HSK5 下 (19–36) болон HSK4 20-р хичээлд ЖИНХЭНЭ АУДИО холбох
-- =============================================================================
-- Аудио файлууд Storage-д аль хэдийн байсан (hsk-audio/hsk5B…, lesson-media/hsk4/hsk4-l20).
-- Энэ скрипт хичээлийн бичвэр, дасгалын номын сонсголд тэдгээрийг холбоно.
-- Supabase → SQL Editor → бүхэлд нь Run (1 удаа). Дахин ажиллуулахад аюулгүй.

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-19/hsk5B-textbook-1901.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-19/hsk5B-textbook-1901.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-19/hsk5B-textbook-1901.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-19/hsk5B-workbook-1901.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-19/hsk5B-workbook-1902.mp3"')::text
where id = 'hsk5-l19';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-20/hsk5B-textbook-2001.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-20/hsk5B-textbook-2001.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-20/hsk5B-textbook-2001.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-20/hsk5B-workbook-2001.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-20/hsk5B-workbook-2002.mp3"')::text
where id = 'hsk5-l20';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-21/hsk5B-textbook-2101.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-21/hsk5B-textbook-2101.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-21/hsk5B-textbook-2101.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-21/hsk5B-workbook-2101.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-21/hsk5B-workbook-2102.mp3"')::text
where id = 'hsk5-l21';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-22/hsk5B-textbook-2201.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-22/hsk5B-textbook-2201.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-22/hsk5B-textbook-2201.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-22/hsk5B-workbook-2201.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-22/hsk5B-workbook-2202.mp3"')::text
where id = 'hsk5-l22';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-23/hsk5B-textbook-2301.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-23/hsk5B-textbook-2301.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-23/hsk5B-textbook-2301.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-23/hsk5B-workbook-2301.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-23/hsk5B-workbook-2302.mp3"')::text
where id = 'hsk5-l23';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-24/hsk5B-textbook-2401.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-24/hsk5B-textbook-2401.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-24/hsk5B-textbook-2401.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-24/hsk5B-workbook-2401.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-24/hsk5B-workbook-2402.mp3"')::text
where id = 'hsk5-l24';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-25/hsk5B-textbook-2501.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-25/hsk5B-textbook-2501.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-25/hsk5B-textbook-2501.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-25/hsk5B-workbook-2501.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-25/hsk5B-workbook-2502.mp3"')::text
where id = 'hsk5-l25';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-26/hsk5B-textbook-2601.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-26/hsk5B-textbook-2601.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-26/hsk5B-textbook-2601.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-26/hsk5B-workbook-2601.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-26/hsk5B-workbook-2602.mp3"')::text
where id = 'hsk5-l26';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-27/hsk5B-textbook-2701.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-27/hsk5B-textbook-2701.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-27/hsk5B-textbook-2701.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-27/hsk5B-workbook-2701.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-27/hsk5B-workbook-2702.mp3"')::text
where id = 'hsk5-l27';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-28/hsk5B-textbook-2801.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-28/hsk5B-textbook-2801.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-28/hsk5B-textbook-2801.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-28/hsk5B-workbook-2801.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-28/hsk5B-workbook-2802.mp3"')::text
where id = 'hsk5-l28';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-29/hsk5B-textbook-2901.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-29/hsk5B-textbook-2901.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-29/hsk5B-textbook-2901.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-29/hsk5B-workbook-2901.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-29/hsk5B-workbook-2902.mp3"')::text
where id = 'hsk5-l29';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-30/hsk5B-textbook-3001.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-30/hsk5B-textbook-3001.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-30/hsk5B-textbook-3001.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-30/hsk5B-workbook-3001.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-30/hsk5B-workbook-3002.mp3"')::text
where id = 'hsk5-l30';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-31/hsk5B-textbook-3101.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-31/hsk5B-textbook-3101.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-31/hsk5B-textbook-3101.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-31/hsk5B-workbook-3101.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-31/hsk5B-workbook-3102.mp3"')::text
where id = 'hsk5-l31';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-32/hsk5B-textbook-3201.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-32/hsk5B-textbook-3201.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-32/hsk5B-textbook-3201.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-32/hsk5B-workbook-3201.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-32/hsk5B-workbook-3202.mp3"')::text
where id = 'hsk5-l32';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-33/hsk5B-textbook-3301.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-33/hsk5B-textbook-3301.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-33/hsk5B-textbook-3301.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-33/hsk5B-workbook-3301.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-33/hsk5B-workbook-3302.mp3"')::text
where id = 'hsk5-l33';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-34/hsk5B-textbook-3401.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-34/hsk5B-textbook-3401.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-34/hsk5B-textbook-3401.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-34/hsk5B-workbook-3401.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-34/hsk5B-workbook-3402.mp3"')::text
where id = 'hsk5-l34';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-35/hsk5B-textbook-3501.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-35/hsk5B-textbook-3501.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-35/hsk5B-textbook-3501.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-35/hsk5B-workbook-3501.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-35/hsk5B-workbook-3502.mp3"')::text
where id = 'hsk5-l35';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-36/hsk5B-textbook-3601.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-36/hsk5B-textbook-3601.mp3"'),
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Btextbookaudios/lesson-36/hsk5B-textbook-3601.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-36/hsk5B-workbook-3601.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,shared_audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio/hsk5Bworkbookaudios/lesson-36/hsk5B-workbook-3602.mp3"')::text
where id = 'hsk5-l36';

update public.lessons set audio_url = 'https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-textbook-2001.mp3', media_status = 'ready',
  source_note = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(source_note::jsonb,
    '{hskStudyContent,texts,mainText,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-textbook-2004.mp3"'),
    '{hskStudyContent,texts,shortTexts,0,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-textbook-2001.mp3"'),
    '{hskStudyContent,texts,shortTexts,1,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-textbook-2002.mp3"'),
    '{hskStudyContent,texts,shortTexts,2,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-textbook-2003.mp3"'),
    '{hskStudyContent,texts,shortTexts,3,audioFile}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-textbook-2005.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,items,0,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2001-q1.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,items,1,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2001-q2.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,items,2,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2001-q3.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,items,3,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2001-q4.mp3"'),
    '{hskStudyContent,workbook,listening,parts,0,items,4,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2001-q5.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,items,0,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2002-q6.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,items,1,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2002-q7.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,items,2,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2002-q8.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,items,3,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2002-q9.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,items,4,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2002-q10.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,items,5,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2002-q11.mp3"'),
    '{hskStudyContent,workbook,listening,parts,1,items,6,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2002-q12.mp3"'),
    '{hskStudyContent,workbook,listening,parts,2,items,0,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2003-q13.mp3"'),
    '{hskStudyContent,workbook,listening,parts,2,items,1,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2003-q14.mp3"'),
    '{hskStudyContent,workbook,listening,parts,2,items,2,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2003-q15.mp3"'),
    '{hskStudyContent,workbook,listening,parts,2,items,3,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2003-q16.mp3"'),
    '{hskStudyContent,workbook,listening,parts,2,items,4,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2003-q17.mp3"'),
    '{hskStudyContent,workbook,listening,parts,2,items,5,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2003-q18.mp3"'),
    '{hskStudyContent,workbook,listening,parts,2,items,6,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2003-q19-20.mp3"'),
    '{hskStudyContent,workbook,listening,parts,2,items,7,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2003-q19-20.mp3"'),
    '{hskStudyContent,workbook,listening,parts,2,items,8,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2003-q21-22.mp3"'),
    '{hskStudyContent,workbook,listening,parts,2,items,9,audio}', '"https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/lesson-media/hsk4/hsk4-l20/audio/hsk4B-workbook-2003-q21-22.mp3"')::text
where id = 'hsk4-l20';

-- ШАЛГАХ — with_audio 19 байх ёстой
select count(*) as with_audio from public.lessons
where audio_url is not null and (id = 'hsk4-l20' or (course_id = 'hsk5' and order_index between 19 and 36));
