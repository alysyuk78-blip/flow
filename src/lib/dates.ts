import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isPast,
  differenceInCalendarDays,
  startOfDay,
} from "date-fns";
import { uk } from "date-fns/locale";

/** Сьогоднішня дата у форматі yyyy-mm-dd. */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function toDate(iso: string): Date {
  return parseISO(iso);
}

/** Людяний підпис дати українською: «Сьогодні», «Завтра», «12 лип.» тощо. */
export function humanDate(iso: string | null): string {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isToday(d)) return "Сьогодні";
  if (isTomorrow(d)) return "Завтра";
  return format(d, "d MMM", { locale: uk });
}

export function fullDate(iso: string | null): string {
  if (!iso) return "";
  return format(parseISO(iso), "d MMMM yyyy", { locale: uk });
}

/** Чи прострочено дедлайн (у минулому і не сьогодні). */
export function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  const d = startOfDay(parseISO(iso));
  return isPast(d) && !isToday(d);
}

export function isDueToday(iso: string | null): boolean {
  if (!iso) return false;
  return isToday(parseISO(iso));
}

/** Різниця в календарних днях від сьогодні (може бути від'ємною). */
export function daysFromToday(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date());
}

export function monthLabel(d: Date): string {
  return format(d, "LLLL yyyy", { locale: uk });
}

export function weekdayShort(d: Date): string {
  return format(d, "EEEEEE", { locale: uk });
}
