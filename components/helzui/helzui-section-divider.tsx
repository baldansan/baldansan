type Props = {
  title: string;
  count?: string;
};

export function HelzuiSectionDivider({ title, count }: Props) {
  return (
    <div className="hz-sec-divider">
      <span className="hz-sec-divider-t">{title}</span>
      {count ? <span className="hz-sec-divider-cnt">{count}</span> : null}
      <span className="hz-sec-divider-l" />
    </div>
  );
}
