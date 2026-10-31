export function MetricCard({
  icon,
  label,
  value,
  detail,
  accent = "blue"
}: {
  icon: string;
  label: string;
  value: number | string;
  detail: string;
  accent?: string;
}) {
  return (
    <article className={`admin-kpi admin-kpi-${accent}`}>
      <div className="admin-kpi-icon">
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div className="admin-kpi-value">{value}</div>
        <div className="admin-kpi-label">{label}</div>
        <div className="admin-kpi-detail">{detail}</div>
      </div>
    </article>
  );
}
