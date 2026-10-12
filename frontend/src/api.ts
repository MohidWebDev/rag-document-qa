/**
 * Typed client for the FastAPI backend (backend/main.py).
 *
 * In development every call goes to `/api/...`, which the Vite dev server proxies
 * to the backend (see vite.config.ts). Set VITE_API_URL to call the backend directly,
 * e.g. for a production build served from a different origin.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

// ---------- Backend response shapes ----------

export interface ApiDocument {
  doc_id: string;
  filename: string;
  extension: string;
  size_bytes: number;
  segment_count: number;
  chunk_count: number;
  content_hash: string;
  uploaded_at: string;
}

export interface ApiSource {
  number: number;
  doc_id: string;
  filename: string;
  page: number | null;
  section: string | null;
  snippet: string;
  similarity: number;
}

export interface ApiAnswer {
  answer: string;
  answered: boolean;
  sources: ApiSource[];
}

export interface ApiSegment {
  doc_id: string;
  filename: string;
  segment_index: number;
  page: number | null;
  section: string | null;
  text: string;
}

export interface ApiConfig {
  allowed_extensions: string[];
  max_file_size_mb: number;
  chunk_size: number;
  chunk_overlap: number;
  embed_model: string;
  embed_dimensions: number;
  retrieval_k: number;
  retrieval_max_distance: number;
  chat_model: string;
}

export interface ApiHealth {
  status: string;
  gemini_key_loaded: boolean;
}

// ---------- Errors ----------

export class ApiError extends Error {
  status: number;
  /** The raw `detail` the backend sent, when there was one. */
  detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }

  /** True when the request never reached the backend (server down, network gone). */
  get isNetworkError() {
    return this.status === 0;
  }
}

/** Turn FastAPI's `detail` (string, object or validation list) into one readable line. */
function detailMessage(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : ''))
      .filter(Boolean)
      .map((m) => m.replace(/^Value error, /, ''));
    if (msgs.length) return msgs.join(' ');
  }
  if (detail && typeof detail === 'object' && 'message' in detail) {
    return String((detail as { message: unknown }).message);
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const detail = body && typeof body === 'object' && 'detail' in body ? (body as { detail: unknown }).detail : body;
    // A proxy with no backend behind it answers 502/503/504 without a FastAPI body
    if (res.status >= 502 && res.status <= 504 && !(body && typeof body === 'object' && 'detail' in body)) {
      throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
    }
    throw new ApiError(res.status, detailMessage(detail, `Request failed (${res.status}).`), detail);
  }
  return body as T;
}

// ---------- Endpoints ----------

export const api = {
  health: () => request<ApiHealth>('/health'),

  config: () => request<ApiConfig>('/config'),

  listDocuments: () => request<ApiDocument[]>('/documents'),

  deleteDocument: (docId: string) =>
    request<{ deleted: string }>(`/documents/${encodeURIComponent(docId)}`, { method: 'DELETE' }),

  getSegments: (docId: string) => request<ApiSegment[]>(`/documents/${encodeURIComponent(docId)}/segments`),

  ask: (question: string, docId: string | null, signal?: AbortSignal) =>
    request<ApiAnswer>('/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, doc_id: docId }),
      signal,
    }),

  /**
   * Upload a file. Uses XHR (not fetch) so we can report upload progress;
   * `onUploaded` fires once the bytes are sent and the server starts parsing/indexing.
   */
  uploadDocument: (
    file: File,
    onProgress?: (fraction: number) => void,
    onUploaded?: () => void,
  ): Promise<ApiDocument> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
      };
      xhr.upload.onload = () => onUploaded?.();

      xhr.onload = () => {
        let body: unknown = null;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          body = xhr.responseText;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(body as ApiDocument);
          return;
        }
        const hasDetail = body && typeof body === 'object' && 'detail' in body;
        if (xhr.status >= 502 && xhr.status <= 504 && !hasDetail) {
          reject(new ApiError(0, 'Cannot reach the server. Is the backend running?'));
          return;
        }
        const detail = hasDetail ? (body as { detail: unknown }).detail : body;
        reject(new ApiError(xhr.status, detailMessage(detail, `Upload failed (${xhr.status}).`), detail));
      };
      xhr.onerror = () => reject(new ApiError(0, 'Cannot reach the server. Is the backend running?'));

      const form = new FormData();
      form.append('file', file);
      xhr.send(form);
    }),
};
