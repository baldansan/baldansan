-- =============================================================================
-- assignment-attachments bucket — хэмжээ, төрлийн хязгаарыг сервер талд тогтоох
-- =============================================================================
--
-- Яагаад хэрэгтэй вэ:
-- 002 нь bucket-ийг private болгосон ч хэмжээ, файлын төрлийн хязгаарыг
-- тавиагүй тул Supabase дээр «Unset (50 MB)», «Any» гэж харагдаж байв.
-- Апп өөрөө 20МБ болон тодорхой өргөтгөлүүдийг шалгадаг — гэхдээ энэ бол
-- зөвхөн ХӨТЧИЙН талын шалгалт. Нэвтэрсэн хүн API руу шууд хандвал 50МБ-ын
-- дурын төрлийн файл байршуулж чадна. Хэрэглэгчид амласан хязгаарыг
-- сервер өөрөө мөрдөж байх ёстой.
--
-- Тоонууд нь `lib/supabase/classrooms.ts`-ийн
-- ASSIGNMENT_ATTACHMENT_MAX_BYTES ба ASSIGNMENT_ATTACHMENT_EXTENSIONS-тэй
-- тохирч байна. Аль нэгийг өөрчилвөл нөгөөг нь ч мөн өөрчилнө.
--
-- Дахин ажиллуулахад аюулгүй.
-- =============================================================================

update storage.buckets
set
  public = false,
  file_size_limit = 20971520,   -- 20 МБ
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp',
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'text/plain'
  ]
where id = 'assignment-attachments';

-- Шалгах: public нь false, хязгаарууд тавигдсан эсэх.
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets
 where id = 'assignment-attachments';
