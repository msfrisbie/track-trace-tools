export function isBackgroundExecutionContext() {
  return typeof window === "undefined";
}
