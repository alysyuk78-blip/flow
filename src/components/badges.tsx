import { Flag } from "lucide-react";
import clsx from "clsx";
import { Priority, PRIORITY_LABELS, Tag } from "../types";

const PRIORITY_COLORS: Record<Priority, string> = {
  none: "text-gray-300 dark:text-gray-600",
  low: "text-sky-500",
  medium: "text-amber-500",
  high: "text-red-500",
};

export function PriorityFlag({ priority }: { priority: Priority }) {
  if (priority === "none") return null;
  return (
    <span title={PRIORITY_LABELS[priority]}>
      <Flag className={clsx("h-3.5 w-3.5", PRIORITY_COLORS[priority])} fill="currentColor" />
    </span>
  );
}

export function TagChip({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
  return (
    <span
      className="ios-tag inline-flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{ backgroundColor: tag.color + "22", color: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 opacity-60 hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <div
        className="h-full rounded-full bg-brand-500 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
