/**
 * Saves chats in the browser's localStorage so they survive a page refresh.
 *
 * Chats live only in this browser: they are not sent to the backend, and clearing site
 * data (or using a private window) removes them. Every read and write is wrapped in
 * try/catch because storage can be disabled or full; the app then simply works without history.
 */
import type { ChatMessage, Conversation } from './types';

const STORAGE_KEY = 'askmydocs.conversations.v1';
/** Oldest chats beyond this are dropped, to stay well inside the ~5 MB storage quota. */
const MAX_CONVERSATIONS = 50;
const TITLE_LENGTH = 60;

export function titleFor(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.sender === 'user')?.content.trim() ?? 'New chat';
  const oneLine = first.replace(/\s+/g, ' ');
  return oneLine.length > TITLE_LENGTH ? `${oneLine.slice(0, TITLE_LENGTH - 1)}…` : oneLine;
}

/** An answer that was still loading when the page closed can't finish now. */
function settleInterrupted(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) =>
    m.status === 'loading' ? { ...m, status: 'stopped', content: 'Interrupted when the page was closed.' } : m,
  );
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') return false;
  const c = value as Partial<Conversation>;
  return typeof c.id === 'string' && typeof c.title === 'string' && Array.isArray(c.messages);
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isConversation)
      .map((c) => ({ ...c, messages: settleInterrupted(c.messages) }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  let toSave = conversations.slice(0, MAX_CONVERSATIONS);
  // If storage is full, drop the oldest chats until it fits
  while (toSave.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      return;
    } catch {
      toSave = toSave.slice(0, -1);
    }
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing to do
  }
}

/** Insert or replace a conversation, keeping the list newest-first. */
export function upsertConversation(list: Conversation[], id: string, messages: ChatMessage[]): Conversation[] {
  const now = new Date().toISOString();
  const existing = list.find((c) => c.id === id);
  const updated: Conversation = {
    id,
    title: titleFor(messages),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    messages,
  };
  return [updated, ...list.filter((c) => c.id !== id)];
}

/** "Just now", "5 min ago", "3 h ago", "Yesterday", or a date. */
export function relativeTime(iso: string): string {
  const then = new Date(iso);
  const diffMin = Math.round((Date.now() - then.getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} h ago`;
  if (diffH < 48) return 'Yesterday';
  return then.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
