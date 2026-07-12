import { Task } from "../types";

/** Задачі на критичному шляху (найдовший ланцюг залежностей у проєкті). */
export function criticalPathIds(tasks: Task[]): Set<string> {
  const scoped = tasks.filter((t) => t.kind === "task");
  if (!scoped.length) return new Set();

  const byId = new Map(scoped.map((t) => [t.id, t]));
  const memo = new Map<string, number>();

  function depth(id: string, visiting = new Set<string>()): number {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const task = byId.get(id);
    if (!task) return 0;
    let best = 0;
    for (const dep of task.dependsOn) {
      if (byId.has(dep)) best = Math.max(best, depth(dep, visiting));
    }
    const d = best + 1;
    memo.set(id, d);
    return d;
  }

  let maxDepth = 0;
  let endId = "";
  for (const t of scoped) {
    const d = depth(t.id);
    if (d >= maxDepth) {
      maxDepth = d;
      endId = t.id;
    }
  }

  const path = new Set<string>();
  let cur = endId;
  while (cur) {
    path.add(cur);
    const task = byId.get(cur);
    if (!task || !task.dependsOn.length) break;
    let bestDep = "";
    let bestD = -1;
    for (const dep of task.dependsOn) {
      const d = depth(dep);
      if (d > bestD) {
        bestD = d;
        bestDep = dep;
      }
    }
    cur = bestDep;
  }
  return path;
}
