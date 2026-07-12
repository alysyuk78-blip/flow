import { useStore } from "../store/useStore";
import { RichEditor } from "../components/RichEditor";

export function NotesView({ projectId }: { projectId: string }) {
  const project = useStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const updateProject = useStore((s) => s.updateProject);

  if (!project) return null;

  return (
    <div className="page-container">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <RichEditor
          key={project.id}
          value={project.notes}
          onChange={(html) => updateProject(project.id, { notes: html })}
          placeholder="Опис проєкту, цілі, нотатки…"
        />
      </div>
    </div>
  );
}
