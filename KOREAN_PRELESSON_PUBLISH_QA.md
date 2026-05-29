# Korean PreLesson — Publish QA checklist

Run **before publishing** any PreLesson to learners. Complements [KOREAN_PRELESSON_QA.md](./KOREAN_PRELESSON_QA.md) with tomorrow sprint focus.

---

## A. Course & admin

- [ ] Course `korean-1` exists (`create-korean-course.sql` or admin)
- [ ] Course status = `available` (or your equivalent “visible to learners”)
- [ ] Lesson appears in `/admin/lessons` under Korean Book 1
- [ ] Lesson ID matches JSON (`k-pre-01`, not auto-generated numeric unless intentional)
- [ ] `order_index` correct (0–7 for PreLessons)
- [ ] `source_note` contains `lessonType=prelesson`
- [ ] `media_status` = `missing` or `pending` (not `ready` without files)

---

## B. Content integrity

- [ ] No empty Korean text in vocabulary, subtitles, quiz
- [ ] Romanization (`pinyin`) present on vocabulary rows
- [ ] Mongolian explanation on every vocabulary row
- [ ] `hskLevel` = `KR1` or `KR-PRE` on vocabulary
- [ ] No fake `audioUrl` / `videoUrl` in JSON or lesson row
- [ ] Every quiz `correctAnswer` exactly matches one option
- [ ] Quiz types only `multiple_choice` or `cloze`

### Minimum counts

| Lesson ID | Vocab ≥ | Quiz ≥ |
|-----------|---------|--------|
| k-pre-01 | 12 | 10 |
| k-pre-02 | 12 | 10 |
| k-pre-03 | 15 | 10 |
| k-pre-04 | 12 | 10 |
| k-pre-05 | 15 | 12 |
| k-pre-06 | 12 | 12 |
| k-pre-07 | 15 | 12 |
| k-pre-08 | — | 20 |

---

## C. Learner UI (per lesson)

- [ ] `/lessons/{id}/watch` — **textbook UI**, not “video not added” placeholder
- [ ] `/lessons/{id}/vocabulary` — Hangul + romanization + Mongolian
- [ ] `/lessons/{id}/quiz` — questions load; scoring works
- [ ] Quiz distractors are same-category (vowel vs vowel, not random words)
- [ ] Speaker/TTS button works; layout not broken
- [ ] Missing audio/video state is clean (no broken player)
- [ ] **No Chinese-only labels** on Korean path (e.g. “Хятад → Монгол” → should be “Солонгос → Монгол”)
- [ ] Games hub shows Korean titles (Үсэг таних, Авиа сонгох) when Korean selected

---

## D. Games spot-check

- [ ] `/games/match?lessonId=k-pre-01` — ≥4 vocab pairs
- [ ] `/games/translate?lessonId=k-pre-01` — vowel questions use confusable options
- [ ] `/games/arrange?lessonId=k-pre-05` — syllable tiles (한/글)
- [ ] HSK lesson `/games/match?lessonId=1` — still Chinese behavior

---

## E. Tomorrow publish gate (minimum)

Publish only these after full checklist:

| Priority | Lesson ID | Title |
|----------|-----------|-------|
| **Must** | k-pre-01 | Үндсэн эгшиг |
| **Must** | k-pre-03 | Үндсэн гийгүүлэгч |
| **Must** | k-pre-05 | Үе бүтээх |

**Keep draft:** k-pre-02, k-pre-04, k-pre-06, k-pre-07, k-pre-08

---

## F. Supabase verification

Run [verify-korean-prelesson.sql](./content/korean-book-1/verify-korean-prelesson.sql):

```sql
-- Expect k-pre-01: vocab_count=12, quiz_count=10
select lesson_id, count(*) from public.vocabulary_words
where lesson_id = 'k-pre-01' group by lesson_id;
```

---

## G. Sign-off

| Lesson ID | Imported | QA by | Publish date | Live URL |
|-----------|----------|-------|--------------|----------|
| k-pre-01 | | | | /lessons/k-pre-01 |
| k-pre-03 | | | | /lessons/k-pre-03 |
| k-pre-05 | | | | /lessons/k-pre-05 |

---

## H. Regression

- [ ] `/courses/hsk5` loads
- [ ] HSK lesson quiz unchanged
- [ ] Admin bulk import still works for Chinese lessons
- [ ] No `.env.local` or secrets in git

---

## Quick 5-minute learner path (tomorrow)

1. Select Korean in onboarding  
2. `/courses/korean-1` → **PreLesson 01**  
3. Read subtitle lines on watch page  
4. Vocabulary → ㅏ row  
5. Quiz → 3 questions  
6. Game → Match or Translate  

Homework (no app audio): write ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ and read 아 어 오 우 으 이 aloud.
