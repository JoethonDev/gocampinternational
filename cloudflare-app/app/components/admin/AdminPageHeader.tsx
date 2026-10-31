export function AdminPageHeader({
  title,
  description,
  aside
}: {
  title: string;
  description?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1 className="h3 mb-1">{title}</h1>
        {description && <p className="text-secondary mb-0">{description}</p>}
      </div>
      {aside}
    </div>
  );
}
