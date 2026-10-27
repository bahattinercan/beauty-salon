const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `API error ${res.status}`);
  }
  return res.json();
}

export interface UploadResponse {
  success: boolean;
  data: { url: string; originalName?: string; size?: number };
  timestamp?: string;
}

/**
 * AP-007 W2 — görsel yükleme (`POST /upload/single`).
 *
 * `apiFetch` kullanılamaz: o yardımcı `Content-Type: application/json` yazıyor,
 * multer ise multipart boundary'sini kendi okur (plan R6). Bu yüzden Content-Type
 * **bilerek gönderilmez** — boundary'yi `fetch` + `FormData` kurar. `Authorization`
 * korunur (uç `authenticate` arkasında); alan adı multer `.single('file')` ile sabit.
 */
export async function uploadFile(path: string, file: File): Promise<UploadResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body,
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `API error ${res.status}`);
  }
  return res.json();
}
