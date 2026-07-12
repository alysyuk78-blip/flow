import { Task } from "../types";

/** Чи створює додавання залежності taskId → depId цикл. */
export function wouldCreateCycle(
  tasks: Task[],
  taskId: string,
  newDepId: string
): boolean {
  if (taskId === newDepId) return true;
  const graph = new Map<string, string[]>();
  for (const t of tasks) {
    graph.set(t.id, [...t.dependsOn]);
  }
  const task = graph.get(taskId);
  if (task) task.push(newDepId);

  const visited = new Set<string>();
  function dfs(id: string): boolean {
    if (id === taskId) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    for (const dep of graph.get(id) ?? []) {
      if (dfs(dep)) return true;
    }
    return false;
  }
  return dfs(newDepId);
}

/** Усі задачі, що входять у цикл залежностей з taskId. */
export function cycleMembers(tasks: Task[], taskId: string): string[] {
  const graph = new Map<string, string[]>();
  for (const t of tasks) graph.set(t.id, t.dependsOn);

  const cycle = new Set<string>();
  const stack = new Set<string>();

  function visit(id: string): boolean {
    if (stack.has(id)) {
      cycle.add(id);
      return true;
    }
    if (cycle.has(id)) return false;
    stack.add(id);
    let found = false;
    for (const dep of graph.get(id) ?? []) {
      if (visit(dep)) {
        cycle.add(id);
        found = true;
      }
    }
    stack.delete(id);
    return found;
  }

  visit(taskId);
  return Array.from(cycle);
}
