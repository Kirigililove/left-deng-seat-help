import type { AppUser, ProofField, Seat, UserRole, UserStatus, ZoneConfig } from '@/lib/types';
import type { ProofAnswers } from '@/lib/proof';

type ApiUser = {
  id: string;
  account: string;
  role: UserRole;
  status: UserStatus;
  weibo_name?: string | null;
  wechat_name?: string | null;
  offline_group?: boolean | null;
  reject_reason?: string | null;
  fan_note?: string | null;
  seat?: Seat | null;
};

type ApiZone = { tier_name: string; zone_name: string; row_counts: number[] };

type ApiProofField = { id: string; label: string; type: ProofField['type']; options?: string[] | null; required: boolean };

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '请求失败');
  return data as T;
}

export function mapUser(user: ApiUser): AppUser {
  return {
    id: user.id,
    account: user.account,
    password: '',
    role: user.role,
    status: user.status,
    weiboName: user.weibo_name ?? '',
    wechatName: user.wechat_name ?? '',
    offlineGroup: user.offline_group == null ? '' : user.offline_group ? '是' : '否',
    rejectReason: user.reject_reason ?? '',
    fanNote: user.fan_note ?? '',
    seat: user.seat ?? null
  };
}

export function mapProofField(field: ApiProofField): ProofField {
  return { id: field.id, label: field.label, type: field.type, options: field.options ?? undefined, required: field.required };
}

export function mapZone(zone: ApiZone): ZoneConfig {
  return { tier: zone.tier_name, zone: zone.zone_name, rowCounts: zone.row_counts };
}

export async function loginAccount(account: string, password: string) {
  const data = await apiFetch<{ user: ApiUser }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, password })
  });
  return mapUser(data.user);
}

export async function registerAccount(account: string, password: string) {
  const data = await apiFetch<{ user: ApiUser }>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, password })
  });
  return mapUser(data.user);
}

export async function getMe() {
  const data = await apiFetch<{ user: ApiUser | null }>('/api/auth/me');
  return data.user ? mapUser(data.user) : null;
}

export async function logoutAccount() {
  await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export async function fetchProofFields() {
  const data = await apiFetch<{ fields: ApiProofField[] }>('/api/proof-fields');
  return data.fields.map(mapProofField);
}

export async function fetchZones() {
  const data = await apiFetch<{ zones: ApiZone[] }>('/api/zones');
  return data.zones.map(mapZone);
}

export async function uploadProofFile(fieldId: string, file: File) {
  const form = new FormData();
  form.append('fieldId', fieldId);
  form.append('file', file);
  return apiFetch<{ path: string; name: string }>('/api/me/proof/upload', { method: 'POST', body: form });
}

export async function submitProofToApi(profile: { weiboName: string; wechatName: string; offlineGroup: '是' | '否' }, answers: ProofAnswers) {
  const payload = {
    weiboName: profile.weiboName,
    wechatName: profile.wechatName,
    offlineGroup: profile.offlineGroup,
    answers: Object.entries(answers).map(([fieldId, value]) => {
      if (typeof value === 'object' && !Array.isArray(value) && 'path' in value) return { fieldId, fileUrl: value.path };
      return { fieldId, value };
    })
  };
  await apiFetch<{ ok: boolean }>('/api/me/proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function saveSeatToApi(seat: Seat, message?: string) {
  await apiFetch<{ ok: boolean }>('/api/me/seat', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zone: seat.zone, row: seat.row, no: seat.no, message })
  });
}


export async function fetchAdminUsers() {
  const data = await apiFetch<{ users: ApiUser[]; submissions?: { userId: string; answers: ProofAnswers }[] }>('/api/admin/users');
  return { users: data.users.map(mapUser), submissions: data.submissions ?? [] };
}

export async function approveUser(userId: string) {
  await apiFetch<{ ok: boolean }>('/api/admin/users/' + userId + '/approve', { method: 'POST' });
}

export async function rejectUser(userId: string, reason: string) {
  await apiFetch<{ ok: boolean }>('/api/admin/users/' + userId + '/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
}

export async function deactivateUser(userId: string) {
  await apiFetch<{ ok: boolean }>('/api/admin/users/' + userId + '/deactivate', { method: 'POST' });
}

export async function saveAdminSeatToApi(userId: string, seat: Seat) {
  await apiFetch<{ ok: boolean }>('/api/admin/users/' + userId + '/seat', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zone: seat.zone, row: seat.row, no: seat.no })
  });
}

export async function addProofFieldToApi(field: { label: string; type: ProofField['type']; options?: string[] }) {
  return apiFetch<{ ok: boolean; id: string }>('/api/admin/proof-fields', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(field)
  });
}

export async function deleteProofFieldFromApi(fieldId: string) {
  await apiFetch<{ ok: boolean }>('/api/admin/proof-fields/' + fieldId, { method: 'DELETE' });
}


type ApiNearbySeat = {
  row_no: number;
  seat_no: number;
  message?: string | null;
  app_users?: ApiUser | ApiUser[] | null;
};

type ApiOwnSeat = {
  row_no: number;
  seat_no: number;
  venue_zones?: { tier_name: string; zone_name: string; row_counts?: number[] } | { tier_name: string; zone_name: string; row_counts?: number[] }[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function fetchNearbyUsers() {
  const data = await apiFetch<{ seat: ApiOwnSeat | null; nearby: ApiNearbySeat[]; message?: string }>('/api/me/nearby');
  const zone = firstRelation(data.seat?.venue_zones);
  const seat = data.seat && zone ? { tier: zone.tier_name, zone: zone.zone_name, row: data.seat.row_no, no: data.seat.seat_no } : null;
  const nearby = (data.nearby ?? []).map((item) => {
    const user = firstRelation(item.app_users);
    if (!user) return null;
    return {
      ...mapUser(user),
      fanNote: user.fan_note || item.message || '',
      seat: seat ? { tier: seat.tier, zone: seat.zone, row: item.row_no, no: item.seat_no } : null
    } satisfies AppUser;
  }).filter(Boolean) as AppUser[];
  return { seat, nearby, message: data.message };
}

export async function saveNoteToApi(note: string) {
  await apiFetch<{ ok: boolean }>('/api/me/note', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note })
  });
}

type AdminStats = {
  totalUsers: number;
  approved: number;
  pending: number;
  rejected: number;
  deactivated: number;
  seated: number;
  byZone: Record<string, number>;
};

export async function fetchAdminStats() {
  return apiFetch<AdminStats>('/api/admin/stats');
}

type AdminSeatMapRow = {
  row_no: number;
  seat_no: number;
  message?: string | null;
  app_users?: ApiUser | ApiUser[] | null;
};

export async function fetchAdminSeatMap(zoneName: string) {
  const data = await apiFetch<{ zone: { zone_name: string; tier_name: string; row_counts: number[] }; seats: AdminSeatMapRow[] }>('/api/admin/seatmap/' + encodeURIComponent(zoneName));
  return {
    zone: { tier: data.zone.tier_name, zone: data.zone.zone_name, rowCounts: data.zone.row_counts },
    seats: (data.seats ?? []).map((seat) => ({
      row: seat.row_no,
      no: seat.seat_no,
      message: seat.message ?? '',
      user: firstRelation(seat.app_users)
    }))
  };
}


export async function createZoneInApi(zone: ZoneConfig) {
  await apiFetch<{ ok: boolean; id: string }>('/api/admin/zones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: zone.tier, zone: zone.zone, rowCounts: zone.rowCounts })
  });
}

export async function updateZoneInApi(oldZoneName: string, zone: ZoneConfig) {
  await apiFetch<{ ok: boolean }>('/api/admin/zones/' + encodeURIComponent(oldZoneName), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: zone.tier, zone: zone.zone, rowCounts: zone.rowCounts })
  });
}

export async function deleteZoneInApi(zoneName: string) {
  await apiFetch<{ ok: boolean }>('/api/admin/zones/' + encodeURIComponent(zoneName), { method: 'DELETE' });
}
