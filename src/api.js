const jsonHeaders = {
  "Content-Type": "application/json"
};

async function request(path, options = {}) {
  const response = await fetch(path, options);

  const contentType = response.headers.get("content-type") || "";
  const hasJson = contentType.includes("application/json");
  const hasBody = response.status !== 204;

  let payload = {};
  if (hasBody) {
    if (hasJson) {
      payload = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => "");
      payload = text ? { message: text } : {};
    }
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed (${response.status}).`;
    throw new Error(message);
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

export function deleteActivity(token, activityId) {
  const resolvedId =
    typeof activityId === "object" && activityId !== null
      ? activityId.id || activityId._id
      : activityId;

  if (!resolvedId) {
    throw new Error("Missing activity id for delete request.");
  }

  return request(`/api/activities/${encodeURIComponent(resolvedId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
