export function AdminPanel({
  title,
  description,
  action,
  children,
  className = ""
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={"admin-panel" + (className ? ` ${className}` : "")}>
      {(title || description || action) && (
        <div className="admin-panel-header">
          <div>
            {title && <h2 className="h5 mb-1">{title}</h2>}
            {description && <p className="text-secondary small mb-0">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
