-- DRAFT — Supabase SQL Editor дээр ЭХЛЭЭД мөрийн тоог шалгаад ажиллуулна.
-- ⚠️ Энэ файлыг migration болгон автоматаар deploy хийхгүй.
-- Зөвшөөрсний дараа: supabase/migrations/041_drop_unused_tables.sql болгон нүүлгэж болно.

-- 1) organization_invitation_deliveries
--    Код: зөвхөн migration 016 + EMAIL_DELIVERY_SETUP.md; app код invitation_email_deliveries ашиглана.
--    Шалгах: select count(*) from public.organization_invitation_deliveries;
drop table if exists public.organization_invitation_deliveries cascade;

-- 2) user_diagnostics
--    Код: .ts/.tsx-д reference байхгүй (029-ээр үүсгэсэн, mock test diagnostics хадгалах зориулалттай).
--    Шалгах: select count(*) from public.user_diagnostics;
drop table if exists public.user_diagnostics cascade;

-- 3) user_study_plan
--    Код: .ts/.tsx-д reference байхгүй.
--    Шалгах: select count(*) from public.user_study_plan;
drop table if exists public.user_study_plan cascade;

-- user_mock_attempts — migration 029 аль хэдийн drop хийсэн; дахин аюулгүй:
drop table if exists public.user_mock_attempts cascade;

-- ЭРГЭЛЗЭЭТЭЙ — DROP БҮҮ ХИЙ:
-- organizations, organization_members, organization_invitations, invitation_email_deliveries,
-- mock_tests, user_test_attempts, hsk_words, user_word_srs, user_saved_words, …
