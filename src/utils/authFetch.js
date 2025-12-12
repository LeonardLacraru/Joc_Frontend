const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export async function authFetch(url, options = {}) {
  let access = localStorage.getItem("access");
  options.headers = options.headers || {};
  options.headers["Authorization"] = `Bearer ${access}`;

  let response = await fetch(url, options);

  if (response.status === 401) {
    const refresh = localStorage.getItem("refresh");
    const refreshResponse = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    const refreshData = await refreshResponse.json();
    if (refreshResponse.ok) {
      localStorage.setItem("access", refreshData.access);
      options.headers["Authorization"] = `Bearer ${refreshData.access}`;
      response = await fetch(url, options);
    } else {
      // Clear all auth data to prevent infinite redirect loop
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("username");
      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
      return;
    }
  }
  return response;
}
