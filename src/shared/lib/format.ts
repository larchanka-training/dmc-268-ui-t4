/** Formatting helpers built on Intl; the UI is English-only, so the locale is fixed. */

const LOCALE = "en-US";

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
});

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, {
  numeric: "auto",
});

const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
  ["second", 1000],
];

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatRelativeTime(
  iso: string,
  now: Date = new Date(),
): string {
  const diff = new Date(iso).getTime() - now.getTime();

  for (const [unit, size] of UNITS) {
    if (Math.abs(diff) >= size || unit === "second") {
      return relativeFormatter.format(Math.round(diff / size), unit);
    }
  }

  return relativeFormatter.format(0, "second");
}

/** Run durations are short, so they read better as "1m 12s" than as a relative time. */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes === 0
    ? `${String(seconds)}s`
    : `${String(minutes)}m ${String(seconds)}s`;
}

export function formatMoney(amountInCents: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency }).format(
    amountInCents / 100,
  );
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}
