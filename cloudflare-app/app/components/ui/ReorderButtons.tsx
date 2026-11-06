export function ReorderButtons({
  index,
  count,
  onMove
}: {
  index: number;
  count: number;
  onMove: (step: number) => void;
}) {
  return (
    <div className="d-flex gap-2 mt-2">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        Move up
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        Move down
      </button>
    </div>
  );
}
