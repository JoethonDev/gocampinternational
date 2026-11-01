import type { ComponentProps } from "react";

export function DragHandle({
  label,
  className = "",
  ...props
}: Omit<ComponentProps<"button">, "type"> & { label: string }) {
  return (
    <button
      type="button"
      className={`drag-handle ${className}`.trim()}
      aria-label={`Drag ${label} to reorder`}
      title="Drag to reorder"
      {...props}
    >
      <i className="bi bi-grip-vertical" aria-hidden="true" />
    </button>
  );
}
