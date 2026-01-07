import { clearAuth, getCsrfToken, setPermission } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export type LoginResponse = {
  userId: string;
  permissionLevel: string;
  csrfToken?: string;
  mfaEnabled?: boolean;
};

export type SessionResponse = {
  userId: string;
  permissionLevel: string;
  mfaEnabled: boolean;
};

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

const refreshSession = async () => {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include"
  });

  if (response.ok) {
    const data = (await response.json()) as LoginResponse;
    setPermission(data.permissionLevel);
    return true;
  }

  return false;
};

const request = async (input: string, init?: RequestInit, retry = true) => {
  const headers = new Headers(init?.headers);
  const method = (init?.method ?? "GET").toUpperCase();

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "include"
  });

  if (response.status === 401 && retry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request(input, init, false);
    }
    clearAuth();
    throw new Error("UNAUTHORIZED");
  }

  return response;
};

export async function login(email: string, password: string, mfaCode?: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, mfaCode })
  });

  if (!response.ok) {
    let message = "Falha no login.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const data = (await response.json()) as LoginResponse;
  setPermission(data.permissionLevel);
  return data;
}

export async function logout(): Promise<void> {
  await request(`${API_BASE}/auth/logout`, { method: "POST" }, false);
  clearAuth();
}

export async function fetchSession(): Promise<SessionResponse> {
  const response = await request(`${API_BASE}/auth/me`);
  if (!response.ok) {
    throw new Error("Falha ao carregar sessao.");
  }
  const data = (await response.json()) as SessionResponse;
  setPermission(data.permissionLevel);
  return data;
}

export type MfaSetupResponse = {
  secretBase32: string;
  otpauthUrl: string;
};

export async function setupMfa(label?: string): Promise<MfaSetupResponse> {
  const response = await request(`${API_BASE}/auth/mfa/setup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(label ? { label } : {})
  });

  if (!response.ok) {
    throw new Error("Falha ao configurar MFA.");
  }

  return response.json();
}

export async function verifyMfa(token: string): Promise<void> {
  const response = await request(`${API_BASE}/auth/mfa/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token })
  });

  if (!response.ok) {
    throw new Error("Falha ao confirmar MFA.");
  }
}

export async function fetchUsers() {
  const response = await request(`${API_BASE}/users`);

  if (!response.ok) {
    throw new Error("Falha ao carregar usuarios.");
  }

  return response.json();
}

export async function fetchUserById(id: string) {
  const response = await request(`${API_BASE}/users/${id}`);

  if (!response.ok) {
    throw new Error("Falha ao carregar usuario.");
  }

  return response.json();
}

export async function fetchEvents(start?: string, end?: string): Promise<EventItem[]> {
  const url = new URL(`${API_BASE}/events`);
  if (start) url.searchParams.set("start", start);
  if (end) url.searchParams.set("end", end);

  const response = await request(url.toString());

  if (!response.ok) {
    throw new Error("Falha ao carregar eventos.");
  }

  return response.json();
}

export async function createEvent(payload: Record<string, unknown>): Promise<EventItem> {
  const response = await request(`${API_BASE}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Falha ao criar evento.");
  }

  return response.json();
}

export async function updateEvent(
  id: string,
  payload: Record<string, unknown>
): Promise<EventItem> {
  const response = await request(`${API_BASE}/events/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Falha ao atualizar evento.");
  }

  return response.json();
}

export async function deleteEvent(id: string): Promise<void> {
  const response = await request(`${API_BASE}/events/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Falha ao remover evento.");
  }
}

export async function createUser(payload: Record<string, unknown>) {
  const response = await request(`${API_BASE}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Falha ao criar usuario.");
  }

  return response.json();
}

export async function updateUser(id: string, payload: Record<string, unknown>) {
  const response = await request(`${API_BASE}/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Falha ao atualizar usuario.");
  }

  return response.json();
}

export async function createCredentials(payload: {
  userId: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<void> {
  const response = await request(`${API_BASE}/auth/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let message = "Falha ao criar credenciais.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
}
