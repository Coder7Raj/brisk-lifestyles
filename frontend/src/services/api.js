const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let refreshPromise = null;
let onAuthExpired = () => {};

function formatValidationDetails(details) {
  if (!Array.isArray(details) || !details.length) return "";
  return details
    .map(({ path, message }) => {
      const field = String(path || "")
        .replace(/\.\d+(?=\.|$)/g, "")
        .split(/[._]/)
        .filter(Boolean)
        .join(" ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase();
      const label = field
        ? `${field[0].toUpperCase()}${field.slice(1)}`
        : "Input";
      const explanation = String(message || "is invalid")
        .replace(/^String\s+/i, "")
        .replace(
          /(\d+)\s+character\(s\)/gi,
          (_match, count) =>
            `${count} ${Number(count) === 1 ? "character" : "characters"}`,
        );
      return `${label} ${explanation.replace(/[.!?]+$/, "")}.`;
    })
    .join(" ");
}

export function setAuthExpiredHandler(handler) {
  onAuthExpired = handler;
}

async function send(path, options) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
}

export async function apiRequest(path, options = {}, canRefresh = true) {
  let response = await send(path, options);
  if (
    response.status === 401 &&
    canRefresh &&
    path !== "/auth/login" &&
    path !== "/auth/register" &&
    path !== "/auth/refresh"
  ) {
    refreshPromise ||= send("/auth/refresh", { method: "POST" }).finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;
    if (refreshed.ok) response = await apiRequest(path, options, false);
    else onAuthExpired();
  }
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validationMessage = formatValidationDetails(payload.details);
    throw new Error(
      validationMessage ||
        payload.error ||
        "Something went wrong. Please try again.",
    );
  }
  return payload.data;
}
