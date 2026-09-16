-- =============================================================================
-- ЖИШЭЭ ӨГӨГДӨЛ — сургалтын төвийн демо
-- =============================================================================
--
-- 12 бүлэгтэй сургалтын төвийг бүрэн дүүргэнэ: HSK1–HSK6 тус бүр 2 бүлэг,
-- нэг нь танхимын, нөгөө нь онлайн. Бүлэг бүр өөрийн багштай, багш бүр
-- өөр чадвартай тул бүлгүүдийн үр дүн бодитоор ялгаатай гарна.
--
-- ⚠️ ЭНЭ БОЛ ЖИШЭЭ ӨГӨГДӨЛ. Бүх нэр зохиомол, бүх дүн санамсаргүй үүсгэсэн.
-- Үзүүлбэр дээр «энэ бол системийн боломжийг харуулсан жишээ өгөгдөл» гэж
-- хэлэх ёстой — жинхэнэ хэрэглэгчийн тоо биш.
--
-- Хэрхэн ажиллуулах: Supabase → SQL Editor → бүхэлд нь хуулж Run.
-- Дахин ажиллуулахад аюулгүй: эхлээд өмнөх жишээ өгөгдлөө цэвэрлэнэ.
-- Устгах бол: доорх «ЦЭВЭРЛЭХ» хэсгийг дангаар нь ажиллуулна.
--
-- Шаардлага: 054_classroom_delivery_mode.sql миграц ажилласан байх.
-- =============================================================================

-- Бүх жишээ мөр ийм id-тай байна, ингэснээр цэвэрлэхэд хялбар.
-- d0000000-0000-4000-8000-<төрөл 4 орон><дугаар 8 орон>

do $$
declare
  demo_prefix text := 'd0000000-0000-4000-8000-';
begin
  -- ---------------------------------------------------------------- ЦЭВЭРЛЭХ
  delete from public.assignment_results
   where student_user_id::text like demo_prefix || '%'
      or assignment_id in (
        select id from public.assignments
         where id::text like demo_prefix || '%'
      );
  delete from public.assignments where id::text like demo_prefix || '%';
  delete from public.classroom_students
   where id::text like demo_prefix || '%'
      or student_user_id::text like demo_prefix || '%';
  delete from public.classrooms where id::text like demo_prefix || '%';
  delete from public.teacher_profiles where user_id::text like demo_prefix || '%';
  delete from public.organization_members
   where organization_id::text like demo_prefix || '%'
      or user_id::text like demo_prefix || '%';
  delete from public.user_quiz_attempts where user_id::text like demo_prefix || '%';
  delete from public.user_lesson_progress where user_id::text like demo_prefix || '%';
  delete from public.user_vocabulary_progress where user_id::text like demo_prefix || '%';
  delete from public.organizations where id::text like demo_prefix || '%';
end $$;

-- =============================================================================
-- ҮҮСГЭХ
-- =============================================================================

do $$
declare
  demo_prefix constant text := 'd0000000-0000-4000-8000-';

  org_id uuid := (demo_prefix || '0001' || '00000001')::uuid;

  -- Багш бүрийн нэр ба заах чадвар (0–1). Чадвар нь тухайн бүлгийн
  -- сурагчдын дундаж түвшинд шууд нөлөөлнө.
  teacher_names text[] := array[
    'Б. Оюунчимэг', 'Д. Ганбаатар', 'С.Нарантуяа', 'Ж. Энхболд',
    'Г. Мөнхзул', 'Т. Батсайхан', 'Н. Сарантуяа', 'Э. Пүрэвдорж',
    'Ц. Алтанцэцэг', 'Х. Дэлгэрмаа', 'О. Ганзориг', 'Л. Уранчимэг'
  ];
  teacher_skill numeric[] := array[
    0.90, 0.62, 0.84, 0.71,
    0.93, 0.58, 0.79, 0.66,
    0.87, 0.74, 0.55, 0.81
  ];

  given_names text[] := array[
    'Ариунаа','Батбаяр','Цэцэгмаа','Дорж','Энхжин','Ганбат','Хулан','Итгэл',
    'Жавхлан','Хишигт','Лхагвасүрэн','Мөнхбат','Наранцэцэг','Оюунбилэг',
    'Пүрэвсүрэн','Сайханаа','Түвшинбаяр','Уянга','Ванчиг','Ялалт',
    'Золбоо','Амарбат','Билгүүн','Гэрэлмаа','Дөлгөөн','Эрдэнэбат',
    'Сувдаа','Тэмүүлэн','Нэргүй','Одбаяр'
  ];
  family_initials text[] := array['А','Б','В','Г','Д','Ж','З','Л','М','Н','О','П','С','Т','Х','Ц','Ч','Э','Ю','Я'];

  class_index int;
  hsk_level int;
  course text;
  mode text;
  v_teacher_id uuid;
  v_classroom_id uuid;
  skill numeric;

  student_seq int := 0;
  v_student_id uuid;
  v_student_row_id uuid;
  student_count int;
  s int;
  ability numeric;

  lesson_ids text[];
  lesson_count int;
  lesson_reach int;
  li int;
  lesson text;

  v_assignment_id uuid;
  assignment_seq int := 0;

  attempt_percent int;
  answers jsonb;
  q record;
  correct_count int;
  question_total int;

  word_ids bigint[];
  word_take int;
begin
  -- Санамсаргүй тоо давтагдахуйц байхын тулд үрийг тогтооно.
  perform setseed(0.42);

  -- ------------------------------------------------------------ Байгууллага
  insert into public.organizations
    (id, name, organization_type, status, email, phone, address, notes)
  values (
    org_id,
    'Жишээ — «Тэмээ» хятад хэлний сургалтын төв',
    'training_center',
    'active',
    'demo@example.mn',
    '7700-0000',
    'Улаанбаатар',
    'ЖИШЭЭ ӨГӨГДӨЛ — системийн боломжийг харуулах зорилгоор үүсгэсэн.'
  );

  -- ------------------------------------------------- 12 багш, 12 бүлэг
  for class_index in 1..12 loop
    hsk_level := ((class_index - 1) / 2) + 1;      -- 1,1,2,2,…,6,6
    course := 'hsk' || hsk_level;
    mode := case when class_index % 2 = 1 then 'in_person' else 'online' end;
    skill := teacher_skill[class_index];

    v_teacher_id := (demo_prefix || '0002' || lpad(class_index::text, 8, '0'))::uuid;
    v_classroom_id := (demo_prefix || '0003' || lpad(class_index::text, 8, '0'))::uuid;

    insert into public.teacher_profiles
      (user_id, display_name, organization, role, default_organization_id)
    values (
      v_teacher_id,
      teacher_names[class_index],
      'Жишээ — «Тэмээ» сургалтын төв',
      'teacher',
      org_id
    );

    insert into public.organization_members
      (id, organization_id, user_id, email, display_name, role, status)
    values (
      (demo_prefix || '0004' || lpad(class_index::text, 8, '0'))::uuid,
      org_id,
      v_teacher_id,
      'bagsh' || class_index || '@example.mn',
      teacher_names[class_index],
      'teacher',
      'active'
    );

    insert into public.classrooms
      (id, teacher_user_id, name, level, description, status,
       organization_id, delivery_mode, schedule_note, course_id)
    values (
      v_classroom_id,
      v_teacher_id,
      'HSK ' || hsk_level || ' — ' ||
        case when mode = 'in_person' then 'танхим' else 'онлайн' end ||
        ' бүлэг',
      'HSK' || hsk_level,
      'Жишээ бүлэг. HSK ' || hsk_level || ' сурах бичгээр явагдана.',
      'active',
      org_id,
      mode,
      case
        when mode = 'in_person' then 'Даваа, Лхагва, Баасан 19:00'
        else 'Мягмар, Пүрэв 20:00 (Zoom)'
      end,
      course
    );

    -- Тухайн курсын хичээлүүд
    select array_agg(id order by order_index)
      into lesson_ids
      from public.lessons
     where course_id = course;

    lesson_count := coalesce(array_length(lesson_ids, 1), 0);

    -- ------------------------------------------------------- Даалгаврууд
    -- Бүлэг бүрт эхний 4 хичээлээс даалгавар өгсөн гэж үзнэ.
    if lesson_count > 0 then
      for li in 1..least(4, lesson_count) loop
        assignment_seq := assignment_seq + 1;
        v_assignment_id := (demo_prefix || '0005' || lpad(assignment_seq::text, 8, '0'))::uuid;

        insert into public.assignments
          (id, classroom_id, lesson_id, assignment_type, title, instructions,
           due_date, status, organization_id)
        values (
          v_assignment_id,
          v_classroom_id,
          lesson_ids[li],
          'full_lesson',
          li || '-р даалгавар — HSK ' || hsk_level || ' хичээл ' || li,
          'Хичээлээ үзээд дасгалыг бүрэн гүйцэтгэнэ үү.',
          (current_date - ((4 - li) * 7))::date,
          'assigned',
          org_id
        );
      end loop;
    end if;

    -- ---------------------------------------------------------- Сурагчид
    student_count := 10 + floor(random() * 7)::int;   -- 10–16

    for s in 1..student_count loop
      student_seq := student_seq + 1;
      v_student_id := (demo_prefix || '0006' || lpad(student_seq::text, 8, '0'))::uuid;
      v_student_row_id := (demo_prefix || '0007' || lpad(student_seq::text, 8, '0'))::uuid;

      -- Сурагчийн чадвар = багшийн чадвар ± хувийн ялгаа
      ability := greatest(0.25, least(0.99,
        skill + (random() - 0.5) * 0.30
      ));

      insert into public.classroom_students
        (id, classroom_id, student_user_id, display_name, email, status, joined_at)
      values (
        v_student_row_id,
        v_classroom_id,
        v_student_id,
        family_initials[1 + (student_seq % array_length(family_initials, 1))] || '. ' ||
          given_names[1 + (student_seq % array_length(given_names, 1))],
        'suragch' || student_seq || '@example.mn',
        'active',
        now() - ((30 + floor(random() * 30)::int) || ' days')::interval
      );

      -- Хэр хол явсан бэ: чадвартай сурагч илүү олон хичээл дуусгана.
      lesson_reach := least(
        lesson_count,
        greatest(1, round(ability * least(lesson_count, 9))::int)
      );

      for li in 1..lesson_reach loop
        lesson := lesson_ids[li];

        -- Хичээлийн ахиц
        insert into public.user_lesson_progress
          (user_id, lesson_id, status, progress_percent, completed_at, updated_at)
        values (
          v_student_id,
          lesson,
          case when li < lesson_reach then 'completed' else 'in_progress' end,
          case when li < lesson_reach then 100 else 40 + floor(random() * 50)::int end,
          case when li < lesson_reach
               then now() - ((lesson_reach - li) * 3 || ' days')::interval
               else null end,
          now() - ((lesson_reach - li) * 3 || ' days')::interval
        )
        on conflict (user_id, lesson_id) do nothing;

        -- Дасгалын оролдлого — бодит асуултуудаас хариултын түүх үүсгэнэ.
        if li < lesson_reach then
          answers := '[]'::jsonb;
          correct_count := 0;
          question_total := 0;

          for q in
            select id, type, question, correct_answer, options, order_index
              from public.quiz_questions
             where lesson_id = lesson
             order by order_index
          loop
            question_total := question_total + 1;
            -- Сүүлийн асуултууд хүндэрдэг гэж үзээд бага зэрэг хүндрүүлнэ.
            if random() < greatest(0.15, ability - (q.order_index::numeric / 60)) then
              correct_count := correct_count + 1;
              answers := answers || jsonb_build_array(jsonb_build_object(
                'dbId', q.id,
                'questionId', q.id,
                'orderIndex', q.order_index,
                'type', q.type,
                'question', q.question,
                'selectedAnswer', q.correct_answer,
                'correctAnswer', q.correct_answer,
                'isCorrect', true
              ));
            else
              answers := answers || jsonb_build_array(jsonb_build_object(
                'dbId', q.id,
                'questionId', q.id,
                'orderIndex', q.order_index,
                'type', q.type,
                'question', q.question,
                'selectedAnswer', 'Буруу сонголт',
                'correctAnswer', q.correct_answer,
                'isCorrect', false
              ));
            end if;
          end loop;

          if question_total > 0 then
            attempt_percent := round((correct_count::numeric / question_total) * 100)::int;

            insert into public.user_quiz_attempts
              (user_id, lesson_id, score, total, percentage, answers, created_at)
            values (
              v_student_id,
              lesson,
              correct_count,
              question_total,
              attempt_percent,
              answers,
              now() - ((lesson_reach - li) * 3 || ' days')::interval
            );
          end if;
        end if;
      end loop;

      -- Сурсан үгс — хүрсэн хичээлүүдийн үгсээс хувь хэмжээгээр
      select array_agg(w.id)
        into word_ids
        from public.vocabulary_words w
       where w.lesson_id = any(lesson_ids[1:lesson_reach]);

      if word_ids is not null then
        word_take := greatest(1, round(array_length(word_ids, 1) * ability * 0.8)::int);
        insert into public.user_vocabulary_progress
          (user_id, vocabulary_word_id, status, learned_at, updated_at)
        select v_student_id, word_ids[i], 'learned',
               now() - (floor(random() * 30)::int || ' days')::interval,
               now()
          from generate_series(1, least(word_take, array_length(word_ids, 1))) i
        on conflict (user_id, vocabulary_word_id) do nothing;
      end if;

      -- Даалгаврын үр дүн
      insert into public.assignment_results
        (assignment_id, student_user_id, status, completed_at,
         quiz_score, quiz_total, quiz_percentage)
      select
        a.id,
        v_student_id,
        case when random() < ability then 'completed' else 'not_started' end,
        case when random() < ability
             then now() - (floor(random() * 20)::int || ' days')::interval
             else null end,
        round(ability * 15)::int,
        15,
        round(greatest(0.2, least(1.0, ability + (random() - 0.5) * 0.2)) * 100)::int
      from public.assignments a
      where a.classroom_id = v_classroom_id
      on conflict do nothing;
    end loop;
  end loop;

  raise notice 'Жишээ өгөгдөл үүслээ: 12 бүлэг, % сурагч', student_seq;
end $$;

-- =============================================================================
-- ШАЛГАХ
-- =============================================================================
select
  (select count(*) from public.classrooms where id::text like 'd0000000-0000-4000-8000-%') as bulgiin_too,
  (select count(*) from public.teacher_profiles where user_id::text like 'd0000000-0000-4000-8000-%') as bagsh,
  (select count(*) from public.classroom_students where student_user_id::text like 'd0000000-0000-4000-8000-%') as suragch,
  (select count(*) from public.user_quiz_attempts where user_id::text like 'd0000000-0000-4000-8000-%') as dasgal,
  (select count(*) from public.assignment_results where student_user_id::text like 'd0000000-0000-4000-8000-%') as daalgavriin_dun;
