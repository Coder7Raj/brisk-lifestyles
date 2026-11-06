const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let refreshPromise = null;
let onAuthExpired = () => {};

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
  if (!response.ok)
    throw new Error(payload.error || "Something went wrong. Please try again.");
  return payload.data;
}
