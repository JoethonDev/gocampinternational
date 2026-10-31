const COLORS: Record<string, string> = {
  active: "success",
  inactive: "secondary",
  "coming-soon": "warning",
  trash: "danger",
  new: "warning",
  read: "secondary",
  replied: "success",
  archived: "secondary"
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge bg-${COLORS[status] || "secondary"}`}>{status}</span>;
}
