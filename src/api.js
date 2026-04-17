const jsonHeaders = {
  "Content-Type": "application/json"
};

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Something went wrong.");
  }

  return payload;
}

export function registerUser(formData) {
  return request("/api/auth/register", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(formData)
  });
}

export function loginUser(formData) {
  return request("/api/auth/login", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(formData)
  });
}

export function fetchCurrentUser(token) {
  return request("/api/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function fetchActivities(token, category) {
  const query = category && category !== "All" ? `?category=${encodeURIComponent(category)}` : "";

  return request(`/api/activities${query}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createActivity(token, formData) {
  return request("/api/activities", {
    method: "POST",
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(formData)
  });
}
