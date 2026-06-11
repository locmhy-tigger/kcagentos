// 基智中學節次時間表
export const MAX_PERIOD = 10;

export interface PeriodSlot {
  label:  string;
  start:  string; // HH:MM
  end:    string; // HH:MM
}

export const PERIODS: Record<number, PeriodSlot> = {
  1:  { label: "第1節",  start: "08:25", end: "09:00" },
  2:  { label: "第2節",  start: "09:00", end: "09:35" },
  3:  { label: "第3節",  start: "09:50", end: "10:25" },
  4:  { label: "第4節",  start: "10:25", end: "11:00" },
  5:  { label: "第5節",  start: "11:15", end: "11:50" },
  6:  { label: "第6節",  start: "11:50", end: "12:25" },
  7:  { label: "第7節",  start: "13:35", end: "14:10" },
  8:  { label: "第8節",  start: "14:10", end: "14:45" },
  9:  { label: "第9節",  start: "14:50", end: "15:25" },
  10: { label: "第10節", start: "15:25", end: "16:00" },
};

// Convert a date (YYYY-MM-DD) + period number → { start: Date, end: Date }
export function periodToDateRange(dateStr: string, period: number): { start: Date; end: Date } | null {
  const slot = PERIODS[period];
  if (!slot) return null;
  const [sh, sm] = slot.start.split(":").map(Number);
  const [eh, em] = slot.end.split(":").map(Number);
  const base = new Date(dateStr);
  // Use local time strings so timezone offsets don't shift the date
  const start = new Date(`${dateStr}T${slot.start}:00+08:00`);
  const end   = new Date(`${dateStr}T${slot.end}:00+08:00`);
  void base; void sh; void sm; void eh; void em; // suppress unused warnings
  return { start, end };
}
