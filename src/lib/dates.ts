export const AFRICA_BRAZZAVILLE = 'Africa/Brazzaville';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: AFRICA_BRAZZAVILLE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: AFRICA_BRAZZAVILLE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: AFRICA_BRAZZAVILLE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: AFRICA_BRAZZAVILLE,
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return dateFormatter.format(new Date(iso));
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return shortDateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return dateTimeFormatter.format(new Date(iso));
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return timeFormatter.format(new Date(iso));
}

function zonedParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: AFRICA_BRAZZAVILLE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function dateOnly(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateOnly(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function weekBounds(dateInput: string | Date = new Date()): {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
} {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const { year, month, day } = zonedParts(date);
  const isoDate = dateOnly(year, month, day);
  const cursor = new Date(`${isoDate}T12:00:00Z`);
  const weekday = cursor.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = addDays(isoDate, mondayOffset);
  const sunday = addDays(monday, 6);
  const thursday = addDays(monday, 3);
  const thursdayDate = new Date(`${thursday}T12:00:00Z`);
  const yearStart = new Date(Date.UTC(thursdayDate.getUTCFullYear(), 0, 1));
  const weekNumber =
    Math.floor(
      (thursdayDate.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000),
    ) + 1;
  return { weekStart: monday, weekEnd: sunday, weekNumber };
}

export function formatDay(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T12:00:00Z`));
}

export function formatWeekRange(weekStart: string, weekEnd: string): string {
  return `${formatDay(weekStart)} au ${formatDay(weekEnd)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
