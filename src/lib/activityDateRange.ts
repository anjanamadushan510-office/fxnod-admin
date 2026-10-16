export type ActivityDateRange = {
  active_since?: string;
  active_until?: string;
};

function localDayBoundary(value: string, nextDay = false) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day + (nextDay ? 1 : 0));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * A lone date means that calendar day. With two dates, both selected days are
 * included. The API receives an exclusive upper boundary to avoid losing
 * activity in the final day's last millisecond.
 */
export function activityDateRange(from: string, to: string): ActivityDateRange {
  const first = from || to;
  const last = to || from;
  if (!first || !last) return {};
  return {
    active_since: localDayBoundary(first),
    active_until: localDayBoundary(last, true),
  };
}
