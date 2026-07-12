import { addDays, format, parseISO } from "date-fns";
import { Priority } from "../types";
import { todayISO } from "./dates";

export interface ParsedTaskInput {
  title: string;
  dueDate?: string | null;
  deferUntil?: string | null;
  priority?: Priority;
  tagNames: string[];
  contextNames: string[];
  timeEstimateMinutes?: number | null;
  important?: boolean;
  urgent?: boolean;
  waitingFor?: string | null;
  isMyDay?: boolean;
}

function shift(days: number): string {
  return format(addDays(parseISO(todayISO()), days), "yyyy-MM-dd");
}

function parseDateToken(token: string): string | null {
  const lower = token.toLowerCase();
  if (lower === "сьогодні" || lower === "today") return todayISO();
  if (lower === "завтра" || lower === "tomorrow") return shift(1);
  if (lower === "післязавтра") return shift(2);

  const dmy = token.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = dmy[3]
      ? Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3])
      : new Date().getFullYear();
    return format(new Date(year, month - 1, day), "yyyy-MM-dd");
  }
  return null;
}

function parsePriority(token: string): Priority | null {
  const t = token.toLowerCase();
  if (["!високий", "!high", "p1", "!!!"].includes(t)) return "high";
  if (["!середній", "!medium", "p2", "!!"].includes(t)) return "medium";
  if (["!низький", "!low", "p3", "!"].includes(t)) return "low";
  return null;
}

function parseDuration(token: string): number | null {
  const m = token.match(/^(\d+)\s*(хв|хвил|m|min)$/i);
  if (m) return Number(m[1]);
  const h = token.match(/^(\d+)\s*(г|год|h|hr)$/i);
  if (h) return Number(h[1]) * 60;
  return null;
}

/**
 * Розбір природної мови у полі додавання задачі.
 * Приклади: «Зустріч завтра !високий #робота @офіс 30хв»
 */
export function parseTaskInput(raw: string): ParsedTaskInput {
  let text = raw.trim();
  const result: ParsedTaskInput = {
    title: "",
    tagNames: [],
    contextNames: [],
  };

  // Очікування: «очікую: Іван» або «чекаю Іван»
  const waitMatch = text.match(/(?:очікую|чекаю)[:\s]+([^#@!]+)/i);
  if (waitMatch) {
    result.waitingFor = waitMatch[1].trim();
    text = text.replace(waitMatch[0], " ").trim();
  }

  if (/\b(мій\s*день|myday|сьогодні\+)\b/i.test(text)) {
    result.isMyDay = true;
    text = text.replace(/\b(мій\s*день|myday|сьогодні\+)\b/gi, " ").trim();
  }

  if (/\bважливо\b/i.test(text)) {
    result.important = true;
    text = text.replace(/\bважливо\b/gi, " ").trim();
  }
  if (/\bтерміново\b/i.test(text)) {
    result.urgent = true;
    text = text.replace(/\bтерміново\b/gi, " ").trim();
  }

  // Відкладення: «з 20.07»
  const deferMatch = text.match(/\bз\s+(\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?)\b/i);
  if (deferMatch) {
    result.deferUntil = parseDateToken(deferMatch[1]);
    text = text.replace(deferMatch[0], " ").trim();
  }

  // Дедлайн: «до 15.07» або окремі дати
  const dueMatch = text.match(/\bдо\s+(\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?|сьогодні|завтра|післязавтра|today|tomorrow)\b/i);
  if (dueMatch) {
    const token = dueMatch[1];
    result.dueDate = parseDateToken(token) ?? shift(0);
    text = text.replace(dueMatch[0], " ").trim();
  } else {
    for (const word of ["сьогодні", "завтра", "післязавтра", "today", "tomorrow"]) {
      const re = new RegExp(`\\b${word}\\b`, "i");
      if (re.test(text)) {
        result.dueDate = parseDateToken(word);
        text = text.replace(re, " ").trim();
        break;
      }
    }
  }

  // Тривалість
  for (const part of text.split(/\s+/)) {
    const mins = parseDuration(part);
    if (mins) {
      result.timeEstimateMinutes = mins;
      text = text.replace(part, " ").trim();
      break;
    }
  }

  // Пріоритет
  for (const part of text.split(/\s+/)) {
    const p = parsePriority(part);
    if (p) {
      result.priority = p;
      text = text.replace(part, " ").trim();
      break;
    }
  }

  // Контексти @...
  const contexts = text.match(/@[\w'а-яіїєґ-]+/gi) ?? [];
  for (const c of contexts) {
    result.contextNames.push(c.toLowerCase());
    text = text.replace(c, " ").trim();
  }

  // Теги #...
  const tags = text.match(/#[\w'а-яіїєґ-]+/gi) ?? [];
  for (const t of tags) {
    result.tagNames.push(t.slice(1));
    text = text.replace(t, " ").trim();
  }

  result.title = text.replace(/\s+/g, " ").trim();
  return result;
}
