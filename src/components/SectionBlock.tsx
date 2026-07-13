import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import clsx from "clsx";
import { ProjectSection } from "../types";
import { useStore } from "../store/useStore";

function SortableSection({
  section,
  children,
}: {
  section: ProjectSection;
  children: React.ReactNode;
}) {
  const updateSection = useStore((s) => s.updateSection);
  const deleteSection = useStore((s) => s.deleteSection);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(section.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function save() {
    const t = title.trim();
    if (t) updateSection(section.id, t);
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(isDragging && "opacity-50")}
    >
      <div className="mb-2 flex items-center gap-1 px-3">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Перетягнути розділ ${section.title}`}
          title="Перетягнути розділ"
          className="touch-target -ml-2 flex cursor-grab items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            className="min-h-11 flex-1 rounded-lg border border-brand-300 bg-transparent px-2 ios-form-control font-semibold outline-none dark:border-brand-500"
          />
        ) : (
          <h3
            onClick={() => setEditing(true)}
            className="flex flex-1 cursor-text items-center gap-1 text-ios-body font-semibold text-gray-700 dark:text-gray-200"
          >
            {section.title}
            <Pencil className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100" />
          </h3>
        )}
        <button
          onClick={() => {
            if (confirm(`Видалити розділ «${section.title}»?`))
              deleteSection(section.id);
          }}
          title="Видалити розділ"
          aria-label={`Видалити розділ ${section.title}`}
          className="touch-target -mr-2 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}

/** Розділ проєкту з перетягуванням і редагуванням назви. */
export function SectionBlock({
  sections,
  projectId,
  renderTasks,
}: {
  sections: ProjectSection[];
  projectId: string;
  renderTasks: (sectionId: string | null) => React.ReactNode;
}) {
  const reorderSections = useStore((s) => s.reorderSections);
  const ids = sections.map((s) => s.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    reorderSections(projectId, arrayMove(ids, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {sections.map((sec) => (
            <SortableSection key={sec.id} section={sec}>
              {renderTasks(sec.id)}
            </SortableSection>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
