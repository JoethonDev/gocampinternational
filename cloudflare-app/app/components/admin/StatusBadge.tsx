const TONE: Record<string, string> = {
  active: "success",
  replied: "success",
  inactive: "neutral",
  read: "neutral",
  archived: "neutral",
  "coming-soon": "warning",
  new: "warning",
  trash: "danger"
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE[status] || "neutral";
  return (
    <span className={`admin-status admin-status-${tone}`}>
      <span className="admin-status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
