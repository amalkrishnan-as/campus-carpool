function getBaseUrl(): string {
  // Server-side: check for Vercel Services internal binding BACKEND_URL
  if (typeof window === 'undefined') {
    return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  // Client-side: if NEXT_PUBLIC_API_URL is configured use it, else empty for relative path via Vercel rewrites
  return process.env.NEXT_PUBLIC_API_URL || '';
}

class ApiError extends Error {
  constructor(public status: number, public detail: unknown) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail));
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const base = getBaseUrl();
  const endpoint = base ? `${base.replace(/\/+$/, '')}/api/v1${path}` : `/api/v1${path}`;

  const res = await fetch(endpoint, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({ detail: res.statusText }));
  if (!res.ok) {
    throw new ApiError(res.status, data.detail || data);
  }
  return data as T;
}

export { request, ApiError };

// Auth
export const api = {
  auth: {
    register: (body: unknown) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: unknown) => request<{ access_token: string; refresh_token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: (token: string) => request('/auth/logout', { method: 'POST', token }),
    verify: (token: string) => request('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) }),
    forgotPassword: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, new_password: string) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) }),
    refresh: (refresh_token: string) => request<{ access_token: string; refresh_token: string }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token }) }),
  },
  users: {
    me: (token: string) => request('/users/me', { token }),
    updateMe: (token: string, body: unknown) => request('/users/me', { method: 'PATCH', body: JSON.stringify(body), token }),
    changePassword: (token: string, body: unknown) => request('/users/me/change-password', { method: 'POST', body: JSON.stringify(body), token }),
    getUser: (token: string, id: string) => request(`/users/${id}`, { token }),
  },
  vehicles: {
    list: (token: string) => request('/vehicles', { token }),
    create: (token: string, body: unknown) => request('/vehicles', { method: 'POST', body: JSON.stringify(body), token }),
    update: (token: string, id: string, body: unknown) => request(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(body), token }),
    delete: (token: string, id: string) => request(`/vehicles/${id}`, { method: 'DELETE', token }),
  },
  rides: {
    search: (params: Record<string, string | number | undefined>) => {
      const qs = Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
      return request(`/rides/search?${qs}`);
    },
    create: (token: string, body: unknown) => request('/rides', { method: 'POST', body: JSON.stringify(body), token }),
    get: (id: string) => request(`/rides/${id}`),
    myRides: (token: string) => request('/rides/my', { token }),
    cancel: (token: string, id: string) => request(`/rides/${id}/cancel`, { method: 'POST', token }),
    start: (token: string, id: string) => request(`/rides/${id}/start`, { method: 'POST', token }),
    complete: (token: string, id: string) => request(`/rides/${id}/complete`, { method: 'POST', token }),
    request: (token: string, rideId: string) => request(`/rides/${rideId}/requests`, { method: 'POST', token }),
    getRequests: (token: string, rideId: string) => request(`/rides/${rideId}/requests`, { token }),
    rate: (token: string, rideId: string, body: unknown) => request(`/rides/${rideId}/ratings`, { method: 'POST', body: JSON.stringify(body), token }),
    getRatings: (rideId: string) => request(`/rides/${rideId}/ratings`),
  },
  requests: {
    my: (token: string) => request('/requests/me', { token }),
    accept: (token: string, id: string) => request(`/requests/${id}/accept`, { method: 'POST', token }),
    reject: (token: string, id: string) => request(`/requests/${id}/reject`, { method: 'POST', token }),
    cancel: (token: string, id: string) => request(`/requests/${id}/cancel`, { method: 'POST', token }),
  },
  notifications: {
    list: (token: string, unread_only = false) => request(`/notifications?unread_only=${unread_only}`, { token }),
    unreadCount: (token: string) => request<{ count: number }>('/notifications/unread-count', { token }),
    markRead: (token: string, id: string) => request(`/notifications/${id}/read`, { method: 'POST', token }),
    markAllRead: (token: string) => request('/notifications/mark-all-read', { method: 'POST', token }),
  },
  reports: {
    create: (token: string, body: unknown) => request('/reports', { method: 'POST', body: JSON.stringify(body), token }),
    my: (token: string) => request('/reports/me', { token }),
  },
  blocks: {
    block: (token: string, userId: string) => request(`/blocks/${userId}`, { method: 'POST', token }),
    unblock: (token: string, userId: string) => request(`/blocks/${userId}`, { method: 'DELETE', token }),
    list: (token: string) => request('/blocks', { token }),
  },
  admin: {
    users: (token: string, page = 1) => request(`/admin/users?page=${page}`, { token }),
    suspendUser: (token: string, id: string) => request(`/admin/users/${id}/suspend`, { method: 'PATCH', token }),
    activateUser: (token: string, id: string) => request(`/admin/users/${id}/activate`, { method: 'PATCH', token }),
    rides: (token: string, page = 1) => request(`/admin/rides?page=${page}`, { token }),
    cancelRide: (token: string, id: string) => request(`/admin/rides/${id}/cancel`, { method: 'POST', token }),
    reports: (token: string) => request('/admin/reports', { token }),
    updateReport: (token: string, id: string, body: unknown) => request(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify(body), token }),
    analytics: (token: string) => request('/admin/analytics', { token }),
  },
};
