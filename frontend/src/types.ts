import type { ApiDocument, ApiSearchHit, ApiSource } from './api';

export interface SourceCitation {
  id: number;
  docId: string;
  docName: string;
  page: number | null;
  section: string | null;
  snippet: string;
  /** Cosine similarity between the question and the passage, as a percentage (not a confidence score) */
  matchScore: number;
}

/** What the document reader should open: a whole document, optionally scrolled to a cited passage. */
export interface ViewerTarget {
  docId: string;
  docName: string;
  citation?: SourceCitation;
}

export type ChatStatus = 'loading' | 'answered' | 'not-found' | 'error' | 'stopped';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  senderName: string;
  timestamp: string;
  content: string;
  /** Assistant messages only */
  status?: ChatStatus;
  citations?: SourceCitation[];
  /** The question this assistant message answers (used to retry) */
  question?: string;
  /** The scope the question was asked in: a doc_id, or null for all documents */
  scopeDocId?: string | null;
  scopeLabel?: string;
}

/** One saved chat. Kept in the browser's localStorage (see chatStore.ts). */
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface DocumentItem {
  id: string;
  name: string;
  sizeFormatted: string;
  date: string;
  type: 'pdf' | 'md' | 'txt';
  bytes: number;
  chunkCount: number;
  segmentCount: number;
}

export type UploadStatus = 'uploading' | 'processing' | 'success' | 'duplicate' | 'error';

export interface UploadItem {
  id: string;
  fileName: string;
  bytes: number;
  status: UploadStatus;
  /** 0..1 while uploading */
  progress: number;
  message?: string;
  errorKind?: 'too-large' | 'unsupported' | 'unreadable' | 'offline' | 'other';
  /** Set when the upload succeeded, or points at the existing copy for duplicates */
  docId?: string;
  existingName?: string;
  chunkCount?: number;
  segmentCount?: number;
}


// ---------- Mapping helpers ----------

/** "1 chunk", "3 chunks" */
export function plural(n: number, word: string, pluralWord = `${word}s`): string {
  return `${n.toLocaleString()} ${n === 1 ? word : pluralWord}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function toDocumentItem(doc: ApiDocument): DocumentItem {
  const ext = doc.extension.replace('.', '').toLowerCase();
  return {
    id: doc.doc_id,
    name: doc.filename,
    sizeFormatted: formatBytes(doc.size_bytes),
    date: new Date(doc.uploaded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    type: ext === 'md' || ext === 'txt' ? ext : 'pdf',
    bytes: doc.size_bytes,
    chunkCount: doc.chunk_count,
    segmentCount: doc.segment_count,
  };
}

export function toCitation(source: ApiSource): SourceCitation {
  return {
    id: source.number,
    docId: source.doc_id,
    docName: source.filename,
    page: source.page,
    section: source.section,
    snippet: source.snippet,
    matchScore: Math.round(source.similarity * 100),
  };
}

/** A /search hit shaped like a citation, so the reader can open and highlight it. */
export function hitToCitation(hit: ApiSearchHit, index: number): SourceCitation {
  return {
    id: index + 1,
    docId: hit.doc_id,
    docName: hit.filename,
    page: hit.page,
    section: hit.section,
    // Same shape as the backend's citation snippets: whitespace collapsed, first 200 chars
    snippet: hit.text.split(/\s+/).join(' ').trim().slice(0, 200),
    matchScore: Math.round(hit.similarity * 100),
  };
}

/** "P.4", "§ Setup", or "P.4 · § Setup" depending on what the source has. */
export function locationLabel(c: Pick<SourceCitation, 'page' | 'section'>): string {
  const parts: string[] = [];
  if (c.page != null) parts.push(`P.${c.page}`);
  if (c.section) parts.push(`§ ${c.section}`);
  return parts.join(' · ');
}
