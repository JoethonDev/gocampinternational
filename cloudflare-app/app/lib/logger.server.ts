type LogLevel = "info" | "warn" | "error";

export function logEvent(
  level: LogLevel,
  message: string,
  fields: Record<string, unknown> = {}
): void {
  const entry = JSON.stringify({
    message,
    level,
    timestamp: new Date().toISOString(),
    ...fields
  });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
}
