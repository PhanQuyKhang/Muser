import { strings } from "@/shared/strings";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(iso: string, now: number = Date.now()): string {
  const elapsed = Math.max(0, now - Date.parse(iso));
  const t = strings.activity;
  if (elapsed < MINUTE) return t.justNow;
  if (elapsed < HOUR) return t.minutes(Math.floor(elapsed / MINUTE));
  if (elapsed < DAY) return t.hours(Math.floor(elapsed / HOUR));
  return t.days(Math.floor(elapsed / DAY));
}
