/**
 * Format a Firestore Timestamp / Date / epoch-ms as a short relative label.
 */
export function relativeTime(value) {
  if (!value) return "";
  let ms;
  if (typeof value === "number") ms = value;
  else if (value.toMillis) ms = value.toMillis();
  else if (value.seconds) ms = value.seconds * 1000;
  else if (value instanceof Date) ms = value.getTime();
  else return "";

  const diff = Date.now() - ms;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
