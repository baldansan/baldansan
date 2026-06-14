type Props = {
  html: string;
  className?: string;
  as?: "div" | "p" | "span";
};

/** Trusted static course HTML — supports <b>, <br>, <span class="zh">, .bad */
export function HelzuiRichHtml({ html, className = "", as = "div" }: Props) {
  const Tag = as;
  return (
    <Tag
      className={`hz-rich ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
