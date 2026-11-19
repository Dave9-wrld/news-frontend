function errorMessage(data) {
  if (data?.detail) return String(data.detail);
  if (!data || typeof data !== "object") return null;
  const messages = Object.values(data)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value) => typeof value === "string");
  return messages.join(" ") || null;
}

export function asResults(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

export async function chronicleApi(path, options = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`/api/backend/${path.replace(/^\/+|\/+$/g, "")}`, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(data) || "Request failed");
  return data;
}
