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

export const UZ_HOLIDAYS_2026: Record<string, string> = {
  '2026-01-01': 'Yangi yil bayrami',
  '2026-01-14': 'Vatan himoyachilari kuni',
  '2026-03-08': 'Xalqaro xotin-qizlar kuni',
  '2026-03-21': 'Navro‘z umumxalq bayrami',
  '2026-05-09': 'Xotira va qadrlash kuni',
  '2026-09-01': 'Mustaqillik kuni',
  '2026-10-01': 'O‘qituvchi va murabbiylar kuni',
  '2026-12-08': 'Konstitutsiya kuni',
};

export const UZ_WEEKDAYS = [
  { full: 'Yakshanba', short: 'Ya' },
  { full: 'Dushanba', short: 'Du' },
  { full: 'Seshanba', short: 'Se' },
  { full: 'Chorshanba', short: 'Ch' },
  { full: 'Payshanba', short: 'Pa' },
  { full: 'Juma', short: 'Ju' },
  { full: 'Shanba', short: 'Sh' },
];

export const UZ_MONTHS = [
  { month: 1, name: 'Yanvar', code: '01' },
  { month: 2, name: 'Fevral', code: '02' },
  { month: 3, name: 'Mart', code: '03' },
  { month: 4, name: 'Aprel', code: '04' },
  { month: 5, name: 'May', code: '05' },
  { month: 6, name: 'Iyun', code: '06' },
  { month: 7, name: 'Iyul', code: '07' },
  { month: 8, name: 'Avgust', code: '08' },
  { month: 9, name: 'Sentabr', code: '09' },
  { month: 10, name: 'Oktabr', code: '10' },
  { month: 11, name: 'Noyabr', code: '11' },
  { month: 12, name: 'Dekabr', code: '12' },
];

export function parseSafeDate(dateInput: Date | string): Date {
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day, 12, 0, 0);
    }
    return new Date(dateInput);
  }
  return dateInput;
}

export function isWeekend(dateInput: Date | string): boolean {
  const d = parseSafeDate(dateInput);
  const day = d.getDay();
  return day === 0 || day === 6; // 0 = Sunday (Bozor), 6 = Saturday (Shanba)
}

export function getDayOfWeekUz(dateInput: Date | string): { full: string; short: string; dayIndex: number } {
  const d = parseSafeDate(dateInput);
  const dayIndex = d.getDay();
  return { ...UZ_WEEKDAYS[dayIndex], dayIndex };
}

export function getKnownHolidayUz(dateStr: string): string | null {
  return UZ_HOLIDAYS_2026[dateStr] || null;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getMonthNameUz(month: number): string {
  const found = UZ_MONTHS.find((m) => m.month === month);
  return found ? found.name : `${month}-oy`;
}
