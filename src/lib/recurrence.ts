import { addDays, addMonths, addWeeks, addYears, format, parseISO } from "date-fns";
import { Recurrence } from "../types";

/** Наступна дата після iso з урахуванням повторення. */
export function nextOccurrence(iso: string, recurrence: Recurrence): string | null {
  if (recurrence === "none") return null;
  const d = parseISO(iso);
  let next: Date;
  switch (recurrence) {
    case "daily":
      next = addDays(d, 1);
      break;
    case "weekly":
      next = addWeeks(d, 1);
      break;
    case "monthly":
      next = addMonths(d, 1);
      break;
    case "yearly":
      next = addYears(d, 1);
      break;
    default:
      return null;
  }
  return format(next, "yyyy-MM-dd");
}
