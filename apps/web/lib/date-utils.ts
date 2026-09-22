/**
 * Utility functions for timezone-aware date calculations.
 * Always formats dates in Asia/Tashkent (Uzbekistan UTC+5).
 */

export function getUzbekistanDateString(dateInput?: Date | string | number): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  // Format as YYYY-MM-DD in Asia/Tashkent
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

export function isSameUzbekistanDay(date1: Date | string, date2: Date | string): boolean {
  return getUzbekistanDateString(date1) === getUzbekistanDateString(date2);
}
