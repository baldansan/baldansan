# Korean Lesson 0 — Guided Player QA

Checklist for Hangul foundation guided player (`/study/lesson-training/kr-0-hangul-foundation` or `/study/lesson-training/k-pre-01`).

## Guided player

- [ ] Guided player opens from lesson detail **Хичээл эхлэх**
- [ ] Guided player opens from study page **Эхлэх**
- [ ] Progress bar shows step count
- [ ] **Дахин эхлэх** in menu resets to step 1
- [ ] Leaving and returning resumes last step (localStorage)

## Content steps

- [ ] Teacher explanation visible (speech bubble, steps 2 and 7)
- [ ] Hangul concept grids render (vowels, consonants)
- [ ] Syllable visual step shows ㅎ+ㅏ+ㄴ=한
- [ ] Flashcard step works — one card, TTS, learned mark
- [ ] Practice step works — select, check, next question
- [ ] Quiz intro appears before quiz questions
- [ ] Quiz step works — select, reveal, explanation
- [ ] Result screen works — trophy, score, XP, no button overlap
- [ ] Next lesson CTA navigates to following prelesson training URL

## Regression

- [ ] `/lessons/k-pre-01/vocabulary` flashcard list still works
- [ ] `/lessons/k-pre-01/quiz` standalone quiz still works
- [ ] Chinese HSK lesson detail unchanged
- [ ] Admin import routes unaffected
- [ ] `npm run build` passes

## URLs

| URL | Expected |
|-----|----------|
| `/study/lesson-training/kr-0-hangul-foundation` | Resolves to Hangul lesson |
| `/study/lesson-training/k-pre-01` | Full or short guided flow |
| `/lessons/k-pre-01` | Primary CTA → training |
| `/admin/system-check` | Still loads |
