export function safeInternalRedirect(value: string | null | undefined, fallback = "/dashboard") {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\") || /[\r\n]/.test(trimmed)) return fallback;
  return trimmed;
}

export function withNext(path: string, nextPath?: string | null) {
  if (!nextPath) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}next=${encodeURIComponent(nextPath)}`;
}
