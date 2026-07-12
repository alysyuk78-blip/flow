import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useStore } from "../store/useStore";
import { TagChip } from "./badges";

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

export function TagPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const tags = useStore((s) => s.tags);
  const addTag = useStore((s) => s.addTag);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[5]);

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((t) => t !== id)
        : [...selected, id]
    );
  }

  function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = addTag(trimmed, color);
    onChange([...selected, id]);
    setName("");
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {selected
          .map((id) => tags.find((t) => t.id === id))
          .filter(Boolean)
          .map((tag) => (
            <TagChip
              key={tag!.id}
              tag={tag!}
              onRemove={() => toggle(tag!.id)}
            />
          ))}
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-500 hover:border-brand-400 hover:text-brand-500 dark:border-gray-600"
        >
          <Plus className="h-3 w-3" /> Тег
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Теги</span>
            <button onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button key={tag.id} onClick={() => toggle(tag.id)}>
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-2 " +
                    (selected.includes(tag.id)
                      ? "ring-brand-400"
                      : "ring-transparent")
                  }
                  style={{ backgroundColor: tag.color + "22", color: tag.color }}
                >
                  {tag.name}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="Новий тег"
              className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-brand-400 dark:border-gray-600 dark:bg-gray-700"
            />
            <button
              onClick={create}
              className="rounded-lg bg-brand-500 px-2 py-1 text-xs text-white hover:bg-brand-600"
            >
              +
            </button>
          </div>
          <div className="mt-2 flex gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={
                  "h-5 w-5 rounded-full " +
                  (color === c ? "ring-2 ring-offset-1 ring-gray-400" : "")
                }
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
