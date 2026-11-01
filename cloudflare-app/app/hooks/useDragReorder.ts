import { useRef, useState, type DragEvent } from "react";

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function useDragReorder(onMove: (from: number, to: number) => void) {
  const dragIndex = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    dragIndex.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  };

  const handleProps = (index: number) => ({
    draggable: true,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      dragIndex.current = index;
      setDraggingIndex(index);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    },
    onDragEnd: reset
  });

  const itemProps = (index: number) => ({
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (dragIndex.current !== null && dragIndex.current !== index) setOverIndex(index);
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      setOverIndex((current) => (current === index ? null : current));
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("text/plain");
      const from = raw ? Number(raw) : dragIndex.current;
      if (from !== null && Number.isInteger(from) && from !== index) {
        onMove(from, index);
      }
      reset();
    }
  });

  return { draggingIndex, overIndex, handleProps, itemProps };
}
