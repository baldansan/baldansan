import type { ZahialgaLessonContent } from "@/lib/zahialga/types";
import { ZahialgaLesson2Steps } from "@/components/zahialga/zahialga-lesson-2-steps";

type Props = {
  content: ZahialgaLessonContent;
};

function IntroParagraph({ text }: { text: string }) {
  const parts = text.split(/(2003 онд|"эрдэнэс хайх"|"хамгаалалттай төлбөр")/g);
  return (
    <p className="zah-body-p">
      {parts.map((part, i) => {
        if (
          part === "2003 онд" ||
          part === '"эрдэнэс хайх"' ||
          part === '"хамгаалалттай төлбөр"'
        ) {
          return (
            <strong key={i} className="zah-strong">
              {part}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

function SectionParagraph({ text }: { text: string }) {
  const highlights = [
    "Сонголт асар их",
    "Үнэ хямд",
    "зургаар хайдаг",
  ] as const;
  let nodes: React.ReactNode[] = [text];
  for (const phrase of highlights) {
    nodes = nodes.flatMap((node, nodeIndex) => {
      if (typeof node !== "string") return [node];
      const bits = node.split(phrase);
      if (bits.length === 1) return [node];
      const out: React.ReactNode[] = [];
      bits.forEach((bit, bitIndex) => {
        if (bit) out.push(bit);
        if (bitIndex < bits.length - 1) {
          out.push(
            <strong key={`${phrase}-${nodeIndex}-${bitIndex}`} className="zah-strong">
              {phrase}
            </strong>
          );
        }
      });
      return out;
    });
  }
  return <p className="zah-body-p">{nodes}</p>;
}

export function ZahialgaLessonContentView({ content }: Props) {
  if (content.kind === "taobao-intro") {
    return (
      <>
        <IntroParagraph text={content.introParagraph} />
        <div className="zah-facts">
          {content.facts.map((fact) => (
            <div key={fact.label} className="zah-fact">
              <b>{fact.value}</b>
              <span>{fact.label}</span>
            </div>
          ))}
        </div>
        <h4 className="zah-body-h4">{content.sectionTitle}</h4>
        <SectionParagraph text={content.sectionParagraph} />
      </>
    );
  }

  return (
    <>
      <p className="zah-body-p">{content.intro}</p>
      <ZahialgaLesson2Steps />
      <div className="zah-tip">
        <span className="zah-tip-ic" aria-hidden>
          !
        </span>
        <div>
          {content.tip.split("дахин код авах").map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>
                {part}
                <b>дахин код авах</b>
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>
      </div>
      <h4 className="zah-body-h4">{content.termsTitle}</h4>
      <table className="zah-terms">
        <tbody>
          {content.terms.map((row) => (
            <tr key={row.hanzi}>
              <td>
                <span className="zah-term-h bs-zh">{row.hanzi}</span>
                <div className="zah-term-py">{row.pinyin}</div>
              </td>
              <td className="zah-term-mn">{row.meaningMn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
