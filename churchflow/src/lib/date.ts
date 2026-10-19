/**
 * CANONICAL DATE & TIMEZONE UTILITY (WAT / Africa/Lagos)
 * Ensures consistency across browsers and prevents UTC midnight bugs.
 */

const TIMEZONE = 'Africa/Lagos';

/**
 * Returns current Date in Africa/Lagos timezone
 */
export function getNowWAT(): Date {
  const now = new Date();
  const watString = now.toLocaleString('en-US', { timeZone: TIMEZONE });
  return new Date(watString);
}

/**
 * Formats a date into YYYY-MM-DD in Africa/Lagos
 */
export function formatWATDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

/**
 * Returns readable long date string, e.g. "Sunday, October 15, 2026"
 */
export function formatWATReadable(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Returns the most recent service date (Sunday or Wednesday)
 */
export function getMostRecentServiceDate(): { date: string; serviceType: 'Sunday Service' | 'Midweek Service' } {
  const now = getNowWAT();
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ..., 3 = Wed, 6 = Sat
  
  // If today is Sunday or Wednesday, return today
  if (day === 0) {
    return { date: formatWATDateString(now), serviceType: 'Sunday Service' };
  }
  if (day === 3) {
    return { date: formatWATDateString(now), serviceType: 'Midweek Service' };
  }

  // Otherwise find the closest previous service day
  const d = new Date(now);
  while (d.getDay() !== 0 && d.getDay() !== 3) {
    d.setDate(d.getDate() - 1);
  }
  
  const type = d.getDay() === 0 ? 'Sunday Service' : 'Midweek Service';
  return { date: formatWATDateString(d), serviceType: type };
}

/**
 * Checks if a given birthday (e.g. "MM-DD" or "YYYY-MM-DD") is today in WAT
 */
export function isBirthdayToday(bdayString?: string | null): boolean {
  if (!bdayString) return false;
  const clean = bdayString.trim();
  const now = getNowWAT();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');

  // Handle YYYY-MM-DD or MM-DD or DD/MM
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      return parts[1] === currentMonth && parts[2] === currentDay;
    }
    if (parts.length === 2) {
      return parts[0] === currentMonth && parts[1] === currentDay;
    }
  }
  return false;
}
