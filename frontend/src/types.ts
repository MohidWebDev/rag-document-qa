import type { ApiDocument, ApiSource } from './api';

export interface SourceCitation {
  id: number;
  docId: string;
  docName: string;
  page: number | null;
  section: string | null;
  snippet: string;
  matchScore: number;
  matchTag: 'High Match' | 'Medium Match';
}

export type ChatStatus = 'loading' | 'answered' | 'not-found' | 'error';

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

export type NavTab = 'research-chat' | 'document-corpus' | 'citations-sources' | 'analytics-scope';

export type RetrievalScope = string;

export interface PromptArchetype {
  id: string;
  title: string;
  iconName: 'file-text' | 'calendar' | 'lightbulb';
  description: string;
  sampleQuery: string;
}

// ---------- Mapping helpers ----------

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

/** Similarity at or above this counts as a "High Match" in the UI. */
const HIGH_MATCH_SIMILARITY = 0.75;

export function toCitation(source: ApiSource): SourceCitation {
  return {
    id: source.number,
    docId: source.doc_id,
    docName: source.filename,
    page: source.page,
    section: source.section,
    snippet: source.snippet,
    matchScore: Math.round(source.similarity * 100),
    matchTag: source.similarity >= HIGH_MATCH_SIMILARITY ? 'High Match' : 'Medium Match',
  };
}

/** "P.4", "§ Setup", or "P.4 · § Setup" depending on what the source has. */
export function locationLabel(c: Pick<SourceCitation, 'page' | 'section'>): string {
  const parts: string[] = [];
  if (c.page != null) parts.push(`P.${c.page}`);
  if (c.section) parts.push(`§ ${c.section}`);
  return parts.join(' · ');
}
