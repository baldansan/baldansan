import type {
  HskSourceLesson,
  SourceExercise,
  SourceExerciseItem,
  SourceGrammarPoint,
} from "@/types/hsk-source-lesson";

/** Эх сурвалжийг номд байгаагаар нь харуулна — засварлахгүй, орчуулахгүй. */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Details({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="rounded-xl border border-slate-100 bg-slate-50/60 p-3" open={open}>
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">{title}</summary>
      <div className="mt-2 space-y-2 text-sm">{children}</div>
    </details>
  );
}

function ExerciseItem({ it }: { it: SourceExerciseItem }) {
  return (
    <li className="rounded-lg border border-slate-100 bg-white p-2">
      <div className="flex gap-2">
        {it.n != null ? <span className="shrink-0 text-xs text-slate-500">{it.n}.</span> : null}
        <div className="min-w-0 flex-1">
          {it.zh ? <p className="hanzi text-base">{it.zh}</p> : null}
          {it.hint_zh ? <p className="text-xs text-slate-500">（{it.hint_zh}）</p> : null}
          {it.picture_desc_en ? <p className="text-xs italic text-slate-500">[зураг] {it.picture_desc_en}</p> : null}
          {it.transcript_zh ? (
            <p className="mt-1 whitespace-pre-line rounded bg-amber-50 p-2 text-sm text-slate-700">
              🎧 {it.transcript_zh}
            </p>
          ) : null}
          {it.options ? (
            <ul className="mt-1 grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-2">
              {Object.entries(it.options).map(([k, v]) => (
                <li key={k} className={it.answer === k ? "font-semibold text-emerald-700" : ""}>
                  {k}. {v}
                </li>
              ))}
            </ul>
          ) : null}
          {it.answer && !it.options ? (
            <p className="mt-1 text-sm text-emerald-700">✓ {it.answer}</p>
          ) : null}
          {it.answer_ref ? (
            <p className="text-[11px] text-slate-400">
              хариулт: {it.answer_ref.book} х. {it.answer_ref.pages.join(", ")}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}


function GrammarPoint({ g }: { g: SourceGrammarPoint }) {
  return (
    <Details title={`${g.n}. ${g.title_zh} ${g.title_en ? `· ${g.title_en}` : ""}`} open>
      <p className="whitespace-pre-line text-slate-800">{g.explanation_zh}</p>
      {g.structure_rows?.length ? (
        <pre className="hanzi overflow-x-auto rounded bg-slate-100 p-2 text-sm">{g.structure_rows.join("\n")}</pre>
      ) : null}
      <ol className="space-y-0.5">
        {g.examples.map((e, i) => (
          <li key={i} className="hanzi text-base">
            {e.n != null ? `(${e.n}) ` : ""}
            {e.zh}
            {e.note_zh ? <span className="text-xs text-slate-500">　（{e.note_zh}）</span> : null}
          </li>
        ))}
      </ol>
      {g.practice?.length ? (
        <div>
          <p className="text-xs font-semibold text-slate-600">{g.practice_instruction_zh ?? "练一练"}</p>
          <ul className="space-y-1">
            {g.practice.map((it, i) => (
              <ExerciseItem key={i} it={it} />
            ))}
          </ul>
        </div>
      ) : null}
    </Details>
  );
}

function Exercise({ ex }: { ex: SourceExercise }) {
  return (
    <Details title={`${ex.n} · ${ex.type_zh}`}>
      <p className="text-slate-700">{ex.instruction_zh}</p>
      {ex.instruction_en ? <p className="text-xs text-slate-500">{ex.instruction_en}</p> : null}
      {ex.word_bank?.map((bank, i) => (
        <p key={i} className="hanzi rounded bg-slate-100 px-2 py-1 text-sm">
          {bank.join("　")}
        </p>
      ))}
      {ex.audio ? <p className="text-xs text-slate-500">🔊 {ex.audio}</p> : null}
      <ul className="space-y-1">
        {ex.items.map((it, i) => (
          <ExerciseItem key={i} it={it} />
        ))}
      </ul>
    </Details>
  );
}

export function HskSourceLessonView({ data }: { data: HskSourceLesson }) {
  const tb = data.textbook;
  return (
    <div className="space-y-4">
      <Section title={`第${data.lesson}课 ${data.title_zh}`}>
        <p className="text-slate-600">
          {data.title_pinyin} · {data.title_en}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Сурах бичиг PDF х. {tb.ref.pages[0]}–{tb.ref.pages[tb.ref.pages.length - 1]}
          {data.teacher ? ` · Багшийн ном х. ${data.teacher.ref.pages.join(", ")}` : ""}
          {data.workbook ? ` · Дасгалын ном х. ${data.workbook.ref.pages.join(", ")}` : ""}
        </p>
      </Section>

      {tb.warmup?.length ? (
        <Section title="热身 Warm-up">
          {tb.warmup.map((w, i) => (
            <div key={i} className="mb-2 text-sm">
              <p className="text-slate-800">{w.instruction_zh}</p>
              {w.instruction_en ? <p className="text-xs text-slate-500">{w.instruction_en}</p> : null}
              {w.items?.length ? <p className="hanzi mt-1">{w.items.join("　")}</p> : null}
              {w.pictures_desc_en?.length ? (
                <p className="text-xs italic text-slate-500">[зураг] {w.pictures_desc_en.join(" · ")}</p>
              ) : null}
            </div>
          ))}
        </Section>
      ) : null}

      <Section title="课文 Texts">
        <div className="space-y-3">
          {tb.texts.map((t) => (
            <Details key={t.n} title={`课文${t.n} ${t.title_zh ?? ""} ${t.title_en ? `· ${t.title_en}` : ""}`} open>
              {t.audio ? <p className="text-xs text-slate-500">🔊 {t.audio}</p> : null}
              <div className="space-y-1">
                {t.lines.map((l, i) => (
                  <div key={i}>
                    <p className="hanzi text-base">
                      {l.speaker ? <span className="text-slate-500">{l.speaker}：</span> : null}
                      {l.zh}
                    </p>
                    {l.pinyin ? <p className="text-xs text-slate-500">{l.pinyin}</p> : null}
                  </div>
                ))}
              </div>
              {t.new_words.length ? (
                <table className="mt-2 w-full text-sm">
                  <tbody>
                    {t.new_words.map((w) => (
                      <tr key={w.n} className="border-t border-slate-100">
                        <td className="w-8 py-1 text-slate-400">{w.n}</td>
                        <td className="hanzi py-1 font-semibold">
                          {w.star ? "*" : ""}
                          {w.zh}
                        </td>
                        <td className="py-1 text-slate-700">{w.pinyin}</td>
                        <td className="py-1 text-xs text-slate-500">{w.pos}</td>
                        <td className="py-1 text-slate-700">{w.en}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              {t.proper_nouns?.length ? (
                <p className="text-sm text-slate-600">
                  专有名词: {t.proper_nouns.map((p) => `${p.zh} ${p.pinyin} — ${p.en}`).join("；")}
                </p>
              ) : null}
            </Details>
          ))}
        </div>
      </Section>

      <Section title="注释 Notes (дүрэм)">
        <div className="space-y-3">
          {tb.grammar.map((g) => (
            <Details key={g.n} title={`${g.n}. ${g.title_zh} ${g.title_en ? `· ${g.title_en}` : ""}`} open>
              <p className="whitespace-pre-line text-slate-800">{g.explanation_zh}</p>
              {g.explanation_en ? (
                <p className="whitespace-pre-line text-xs text-slate-500">{g.explanation_en}</p>
              ) : null}
              {g.structure_rows?.length ? (
                <pre className="hanzi overflow-x-auto rounded bg-slate-100 p-2 text-sm">
                  {g.structure_rows.join("\n")}
                </pre>
              ) : null}
              <ol className="space-y-0.5">
                {g.examples.map((e, i) => (
                  <li key={i} className="hanzi text-base">
                    {e.n != null ? `(${e.n}) ` : ""}
                    {e.zh}
                    {e.note_zh ? <span className="text-xs text-slate-500">　（{e.note_zh}）</span> : null}
                  </li>
                ))}
              </ol>
              {g.practice?.length ? (
                <div>
                  <p className="text-xs font-semibold text-slate-600">{g.practice_instruction_zh ?? "练一练"}</p>
                  <ul className="space-y-1">
                    {g.practice.map((it, i) => (
                      <ExerciseItem key={i} it={it} />
                    ))}
                  </ul>
                </div>
              ) : null}
            </Details>
          ))}
        </div>
      </Section>

      <Section title="练习 Exercises (сурах бичиг)">
        <div className="space-y-2">
          {tb.exercises.map((ex, i) => (
            <Exercise key={i} ex={ex} />
          ))}
        </div>
      </Section>

      {tb.characters ? (
        <Section title="汉字 Characters">
          {tb.characters.knowledge_title_zh ? (
            <p className="font-semibold">{tb.characters.knowledge_title_zh}</p>
          ) : null}
          {tb.characters.knowledge_zh ? (
            <p className="whitespace-pre-line text-sm">{tb.characters.knowledge_zh}</p>
          ) : null}
          {tb.characters.characters?.length ? (
            <p className="hanzi mt-1 text-lg">
              {tb.characters.characters.map((c) => `${c.zh}${c.pinyin ? ` (${c.pinyin})` : ""}`).join("　")}
            </p>
          ) : null}
          {tb.characters.word_game?.length ? (
            <ul className="mt-1 text-sm">
              {tb.characters.word_game.map((w, i) => (
                <li key={i} className="hanzi">
                  {w.parts.join(" + ")} → {w.result} {w.en ? <span className="text-xs text-slate-500">{w.en}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {tb.characters.confusable_pairs?.length ? (
            <p className="hanzi mt-1 text-sm">
              辨认: {tb.characters.confusable_pairs.map((p) => p.join("/")).join("　")}
            </p>
          ) : null}
        </Section>
      ) : null}

      {tb.application?.length || tb.saying || tb.culture ? (
        <Section title="运用 · 俗语 · 文化">
          {tb.application?.map((a, i) => (
            <div key={i} className="mb-2 text-sm">
              <p className="font-semibold">{a.title_zh}</p>
              <p className="whitespace-pre-line">{a.instruction_zh}</p>
              {a.example_zh?.length ? <p className="hanzi text-slate-600">{a.example_zh.join("　")}</p> : null}
            </div>
          ))}
          {tb.saying ? (
            <p className="hanzi mt-2 text-base">
              俗语: {tb.saying.zh} <span className="text-xs text-slate-500">{tb.saying.pinyin}</span>
              {tb.saying.explanation_zh ? <span className="block text-sm text-slate-700">{tb.saying.explanation_zh}</span> : null}
            </p>
          ) : null}
          {tb.culture ? (
            <div className="mt-2 text-sm">
              <p className="font-semibold">{tb.culture.title_zh}</p>
              <p className="whitespace-pre-line">{tb.culture.body_zh}</p>
            </div>
          ) : null}
        </Section>
      ) : null}

      {data.teacher ? (
        <Section title="教师用书 Багшийн ном">
          <Details title="教学目标" open>
            <ul className="list-disc pl-5 text-sm">
              {data.teacher.objectives_zh.map((o, i) => (
                <li key={i} className="whitespace-pre-line">{o}</li>
              ))}
            </ul>
          </Details>
          <div className="mt-2 space-y-2">
            {data.teacher.steps.map((s, i) => (
              <Details key={i} title={s.title_zh}>
                <p className="whitespace-pre-line text-sm">{s.body_zh}</p>
              </Details>
            ))}
          </div>
          {data.teacher.notes_zh.length ? (
            <Details title="注意 / 辨析">
              <ul className="list-disc pl-5 text-sm">
                {data.teacher.notes_zh.map((n, i) => (
                  <li key={i} className="whitespace-pre-line">{n}</li>
                ))}
              </ul>
            </Details>
          ) : null}
          {data.teacher.text_questions?.length ? (
            <Details title="课文 асуулт–хариулт">
              <ul className="text-sm">
                {data.teacher.text_questions.map((q, i) => (
                  <li key={i} className="hanzi">
                    <span className="text-xs text-slate-400">课文{q.text} </span>
                    {q.q_zh} {q.a_zh ? <span className="text-emerald-700">— {q.a_zh}</span> : null}
                  </li>
                ))}
              </ul>
            </Details>
          ) : null}
          {data.teacher.summary_zh ? (
            <Details title="本课小结">
              <p className="whitespace-pre-line text-sm">{data.teacher.summary_zh}</p>
            </Details>
          ) : null}
        </Section>
      ) : null}

      {data.workbook ? (
        <Section title="练习册 Дасгалын ном">
          <div className="space-y-2">
            {data.workbook.sections.map((ex, i) => (
              <Exercise key={i} ex={ex} />
            ))}
          </div>
        </Section>
      ) : null}


      {data.hsk30 ? (
        <Section
          title={`HSK 3.0 нэмэлт · ${data.hsk30.source === "upgrade_handbook" ? "升级学练手册" : "课件（补充HSK3.0内容）"} ${data.hsk30.ref.book} ${data.hsk30.source === "upgrade_handbook" ? "х." : "слайд"} ${data.hsk30.ref.pages.join(", ")}`}
        >
          <div className="space-y-3">
            {data.hsk30.new_words.length ? (
              <table className="w-full text-sm">
                <tbody>
                  {data.hsk30.new_words.map((w) => (
                    <tr key={w.n} className="border-b border-slate-100 align-top">
                      <td className="w-8 py-1 text-slate-400">{w.n}</td>
                      <td className="hanzi py-1 text-lg">{w.zh}</td>
                      <td className="py-1 text-slate-600">{w.pinyin}</td>
                      <td className="py-1 text-xs text-slate-500">{w.pos ?? ""}</td>
                      <td className="py-1">
                        {w.en}
                        {w.explanation_zh ? <div className="hanzi text-xs text-slate-500">{w.explanation_zh}</div> : null}
                        {w.examples?.length ? (
                          <ul className="hanzi text-xs text-slate-600">
                            {w.examples.map((e, i) => (
                              <li key={i}>{e.zh}</li>
                            ))}
                          </ul>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {data.hsk30.grammar.map((g) => (
              <GrammarPoint key={g.n} g={g} />
            ))}
            {data.hsk30.exercises.map((ex, i) => (
              <Exercise key={i} ex={ex} />
            ))}
            {data.hsk30.speaking ? (
              <Details title="说一说" open>
                <p className="text-sm text-slate-700">{data.hsk30.speaking.instruction_zh}</p>
                <ol className="hanzi list-decimal pl-5">
                  {data.hsk30.speaking.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ol>
                {data.hsk30.speaking.model_answer_zh ? (
                  <p className="hanzi whitespace-pre-line rounded bg-emerald-50 p-2 text-sm">{data.hsk30.speaking.model_answer_zh}</p>
                ) : null}
              </Details>
            ) : null}
            {data.hsk30.writing ? (
              <Details title="写一写" open>
                <p className="text-sm text-slate-700">{data.hsk30.writing.instruction_zh}</p>
                <p className="hanzi">{data.hsk30.writing.prompt_zh}</p>
                {data.hsk30.writing.model_essay_zh ? (
                  <p className="hanzi whitespace-pre-line rounded bg-emerald-50 p-2 text-sm">{data.hsk30.writing.model_essay_zh}</p>
                ) : null}
              </Details>
            ) : null}
            {data.hsk30.unclear?.length ? (
              <ul className="list-disc pl-5 text-xs text-slate-500">
                {data.hsk30.unclear.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </Section>
      ) : null}

      {data.unclear.length ? (
        <Section title="Тодорхойгүй / номын өөрийн зөрүү">
          <ul className="list-disc pl-5 text-sm text-slate-700">
            {data.unclear.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
