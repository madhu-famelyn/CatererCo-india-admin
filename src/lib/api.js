const BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export async function apiRequest(path, options = {}) {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers = new Headers(options.headers);
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    // Ensure path starts with a slash
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const response = await fetch(`${BASE_URL}${cleanPath}`, {
        ...options,
        headers,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "API Error" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) {
        return {};
    }
    return response.json();
}
