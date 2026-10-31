export function AdminEmptyState({
  icon = "bi-inbox",
  title,
  description,
  action
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-empty-state">
      <i className={`bi ${icon}`} />
      <strong>{title}</strong>
      {description && <p className="small text-secondary mb-0">{description}</p>}
      {action}
    </div>
  );
}
