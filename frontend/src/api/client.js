const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload?.error || payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload;
}

export async function apiRequest(path, { method = "GET", token, body, headers = {}, signal } = {}) {
  const init = {
    method,
    headers: {
      ...headers,
    },
    signal,
  };

  if (token) {
    init.headers.Authorization = `Bearer ${token}`;
  }

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, init);
  return parseResponse(response);
}

export { API_BASE };
