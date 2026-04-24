import {
  API_BASE_URL,
  type LoginRequest,
  type LoginResponse,
  type TelemetryRecord,
} from '@climence/shared';

function withAuth(token?: string) {
  return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {};
}

// History is fetched on-demand when a drone is selected; everything else
// arrives over the WebSocket snapshot stream.
export async function fetchHistory(droneId: string, token?: string): Promise<TelemetryRecord[]> {
  const res = await fetch(`${API_BASE_URL}/api/telemetry/history/${droneId}`, {
    headers: withAuth(token),
  });
  if (!res.ok) throw new Error(`GET history failed: ${res.status}`);
  return res.json() as Promise<TelemetryRecord[]>;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json() as Promise<LoginResponse>;
}

export interface AlertConfigResponse {
  pm25Threshold: number;
  updatedAt: string;
}

export async function fetchAlertConfig(token: string): Promise<AlertConfigResponse> {
  const res = await fetch(`${API_BASE_URL}/api/alerts/config`, {
    headers: withAuth(token),
  });
  if (!res.ok) throw new Error(`GET alert config failed: ${res.status}`);
  return res.json() as Promise<AlertConfigResponse>;
}

export async function updateAlertConfig(pm25Threshold: number, token: string): Promise<AlertConfigResponse> {
  const res = await fetch(`${API_BASE_URL}/api/alerts/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...withAuth(token) },
    body: JSON.stringify({ pm25Threshold }),
  });

  if (!res.ok) throw new Error(`PUT alert config failed: ${res.status}`);
  return res.json() as Promise<AlertConfigResponse>;
}
