// ============================================================
// TimeShift Pro — Shared API Client
// Sprint Foundation: WIRE-1
// Motor -> Fastify backend at /api/v1/*
// ============================================================

const BASE = '/api/v1';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error
      ? typeof json.error === 'string'
        ? json.error
        : JSON.stringify(json.error)
      : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

// ──────────────────────────────────────────
// CHANNELS
// ──────────────────────────────────────────
export interface Channel {
  id: string;
  name: string;
  streamid: string;
  status: string;
  tenant_id: string;
  created_at: string;
}

export const channelsApi = {
  list: () => req<{ success: boolean; channels: Channel[] }>('GET', '/channels'),
  create: (payload: { name: string; streamid: string }) =>
    req<{ success: boolean; id: string }>('POST', '/channels', payload),
};

// ──────────────────────────────────────────
// SHIFTS (TimeShift)
// ──────────────────────────────────────────
export interface Shift {
  id: string;
  channel_id: string;
  delay_seconds: number;
  out_port: number;
  status: 'running' | 'stopped' | 'crashed';
  pid: number | null;
  tenant_id: string;
  created_at: string;
}

export const shiftsApi = {
  list: () => req<{ success: boolean; shifts: Shift[] }>('GET', '/shifts'),
  create: (payload: { channel_id: string; delay_seconds: number; out_port: number }) =>
    req<{ success: boolean; id: string }>('POST', '/shifts', payload),
  destroy: (id: string) => req<{ success: boolean }>('DELETE', `/shifts/${id}`),
};

// ──────────────────────────────────────────
// REMI (Low Latency Routing)
// ──────────────────────────────────────────
export interface Remi {
  id: string;
  channel_id: string;
  out_port: number;
  status: 'running' | 'stopped' | 'crashed';
  pid: number | null;
  tenant_id: string;
  created_at: string;
}

export const remiApi = {
  list: () => req<{ success: boolean; remi: Remi[] }>('GET', '/remi'),
  create: (payload: { channel_id: string; out_port: number }) =>
    req<{ success: boolean; id: string }>('POST', '/remi', payload),
  destroy: (id: string) => req<{ success: boolean }>('DELETE', `/remi/${id}`),
};

// ──────────────────────────────────────────
// SIMULCAST (Social Restreaming)
// ──────────────────────────────────────────
export interface Simulcast {
  id: string;
  channel_id: string;
  destination_name: string;
  rtmp_url: string;
  status: 'running' | 'stopped' | 'crashed';
  pid: number | null;
  tenant_id: string;
  created_at: string;
}

export const simulcastApi = {
  list: () => req<{ success: boolean; simulcasts: Simulcast[] }>('GET', '/simulcasts'),
  create: (payload: { channel_id: string; destination_name: string; rtmp_url: string }) =>
    req<{ success: boolean; id: string }>('POST', '/simulcasts', payload),
  destroy: (id: string) => req<{ success: boolean }>('DELETE', `/simulcasts/${id}`),
};

// ──────────────────────────────────────────
// COMPLIANCE (Passive VOD Dumper)
// ──────────────────────────────────────────
export interface Compliance {
  id: string;
  channel_id: string;
  output_path: string;
  status: 'running' | 'stopped' | 'crashed';
  pid: number | null;
  tenant_id: string;
  created_at: string;
}

export const complianceApi = {
  list: () => req<{ success: boolean; compliance: Compliance[] }>('GET', '/compliance'),
  create: (payload: { channel_id: string; output_path: string }) =>
    req<{ success: boolean; id: string }>('POST', '/compliance', payload),
  destroy: (id: string) => req<{ success: boolean }>('DELETE', `/compliance/${id}`),
};
