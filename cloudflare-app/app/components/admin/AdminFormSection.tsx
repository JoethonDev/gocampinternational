export function AdminFormSection({
  title,
  description,
  action,
  children,
  className = ""
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={"admin-form-section " + className}>
      <div className="admin-form-section-heading">
        <div>
          <h2 className="h6 mb-1">{title}</h2>
          {description && <p className="small text-secondary mb-0">{description}</p>}
        </div>
        {action && <div className="admin-form-section-actions">{action}</div>}
      </div>
      <div className="row g-3">{children}</div>
    </section>
  );
}
