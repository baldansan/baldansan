type Props = {
  title: string;
  description?: string;
};

export function AdminSectionTitle({ title, description }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}
