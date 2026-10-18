export type ActivityDateRange = {
  active_since?: string;
  active_until?: string;
};

function parseLocalDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : undefined;
}

export function activityDateRangeError(from: string, to: string): string | undefined {
  if ((from && !parseLocalDay(from)) || (to && !parseLocalDay(to))) {
    return "Enter a valid date.";
  }
  if (from && to && from > to) return "Active to must be on or after Active from.";
}

/**
 * A lone date means that calendar day. With two dates, both selected days are
 * included. The API receives an exclusive upper boundary to avoid losing
 * activity in the final day's last millisecond.
 */
export function activityDateRange(from: string, to: string): ActivityDateRange {
  const error = activityDateRangeError(from, to);
  if (error) throw new Error(error);
  const first = from || to;
  const last = to || from;
  if (!first || !last) return {};
  const start = parseLocalDay(first)!;
  const end = parseLocalDay(last)!;
  end.setDate(end.getDate() + 1);
  return { active_since: start.toISOString(), active_until: end.toISOString() };
}
