export type TimePrecision = "minute" | "second";

export interface PendingTime {
  hour: string;
  minute: string;
  second: string;
}

export function padTimeUnit(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseTime(value: string): PendingTime {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  return match
    ? { hour: match[1], minute: match[2], second: match[3] ?? "00" }
    : { hour: "00", minute: "00", second: "00" };
}

export function normalizeTime(
  time: PendingTime,
  precision: TimePrecision,
): PendingTime | null {
  const fields =
    precision === "second"
      ? [time.hour, time.minute, time.second]
      : [time.hour, time.minute];
  const limits = [23, 59, 59];
  if (
    fields.some(
      (value, index) =>
        !/^\d{1,2}$/.test(value) || Number(value) > limits[index],
    )
  )
    return null;
  return {
    hour: padTimeUnit(Number(time.hour)),
    minute: padTimeUnit(Number(time.minute)),
    second: padTimeUnit(Number(time.second)),
  };
}

export function formatTime(
  time: PendingTime,
  precision: TimePrecision,
): string {
  return precision === "second"
    ? `${time.hour}:${time.minute}:${time.second}`
    : `${time.hour}:${time.minute}`;
}

export function isValidTimeDraft(
  value: string,
  precision: TimePrecision,
): boolean {
  if (value === "") return true;
  if (!/^\d{0,2}(?::\d{0,2}){0,2}$/.test(value)) return false;
  const parts = value.split(":");
  if (parts.length > (precision === "second" ? 3 : 2)) return false;
  return parts.every((part, index) => {
    if (index < parts.length - 1 && part.length !== 2) return false;
    if (part.length === 0) return index === parts.length - 1;
    const number = Number(part);
    if (index === 0) return number <= (part.length === 1 ? 2 : 23);
    return number <= (part.length === 1 ? 5 : 59);
  });
}

export function formatDigitStream(
  value: string,
  precision: TimePrecision,
): string | null {
  if (value === "") return "";
  if (!/^\d+$/.test(value)) return value.includes(":") ? value : null;
  if (value.length > (precision === "second" ? 6 : 4)) return null;
  if (value.length <= 2) return value;
  const hour = value.slice(0, 2);
  const minute = value.slice(2, 4);
  if (precision === "minute" || value.length <= 4) return `${hour}:${minute}`;
  return `${hour}:${minute}:${value.slice(4, 6)}`;
}
