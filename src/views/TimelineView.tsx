import { useMemo } from "react";
import { useStore } from "../store/useStore";
import { projectTasks, byOrder } from "../lib/filters";
import { TimelineChart } from "../components/TimelineChart";

export function TimelineView({ projectId }: { projectId: string }) {
  const tasks = useStore((s) => s.tasks);
  const items = useMemo(
    () => projectTasks(tasks, projectId).sort(byOrder),
    [tasks, projectId]
  );
  return <TimelineChart items={items} />;
}
