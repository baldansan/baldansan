import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AdminDashboardSection({ title, description, children }: Props) {
  return (
    <section className="admin-panel flex flex-col gap-4 p-5 sm:p-6">
      <div>
        <h2 className="admin-section-title">{title}</h2>
        {description ? (
          <p className="admin-section-desc">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
