import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import clsx from "clsx";
import { Task } from "../types";
import { TaskRow } from "./TaskRow";
import { useStore } from "../store/useStore";

function SortableItem({
  task,
  showProject,
  selectable,
}: {
  task: Task;
  showProject?: boolean;
  selectable?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx("flex items-start gap-1 transition-opacity duration-200", isDragging && "opacity-50")}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="mt-3 shrink-0 cursor-grab rounded p-0.5 text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        title="Перетягнути"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <TaskRow task={task} showProject={showProject} selectable={selectable} />
      </div>
    </div>
  );
}

/** Список задач з перетягуванням для зміни порядку. */
export function SortableTaskList({
  tasks,
  showProject,
  selectable,
}: {
  tasks: Task[];
  showProject?: boolean;
  selectable?: boolean;
}) {
  const reorderTasks = useStore((s) => s.reorderTasks);
  const ids = tasks.map((t) => t.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    reorderTasks(arrayMove(ids, oldIndex, newIndex));
  }

  if (!tasks.length) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {tasks.map((task) => (
            <SortableItem
              key={task.id}
              task={task}
              showProject={showProject}
              selectable={selectable}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
