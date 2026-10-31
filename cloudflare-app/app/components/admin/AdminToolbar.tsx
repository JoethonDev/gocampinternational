export function AdminToolbar({
  children,
  actions
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="admin-toolbar-row">
      <div className="admin-toolbar-fields">{children}</div>
      {actions && <div className="admin-toolbar-actions">{actions}</div>}
    </div>
  );
}

export function AdminToolbarField({
  label,
  htmlFor,
  children
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-toolbar-field">
      <label className="form-label small fw-semibold" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}
