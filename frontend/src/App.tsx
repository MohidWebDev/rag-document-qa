/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TargetCorpusPanel } from './components/TargetCorpusPanel';
import { MainHeader } from './components/MainHeader';
import { OfflineBanner } from './components/OfflineBanner';
import { MobileDrawer } from './components/MobileDrawer';
import { ChatThread } from './components/ChatThread';
import { ChatInputBar } from './components/ChatInputBar';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { DocumentPageViewerModal } from './components/DocumentPageViewerModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { UploadFeedbackGallery } from './components/UploadFeedbackGallery';
import { EmptyStateHero } from './components/EmptyStateHero';
import { ChatHistoryList } from './components/ChatHistoryList';
import { api, ApiConfig, ApiError } from './api';
import { loadConversations, saveConversations, upsertConversation } from './chatStore';
import {
  ChatMessage,
  Conversation,
  DocumentItem,
  SourceCitation,
  UploadItem,
  formatTime,
  ViewerTarget,
  locationLabel,
  toCitation,
  toDocumentItem,
} from './types';
import { Info, AlertTriangle } from 'lucide-react';

// Used until /config loads; mirrors backend/config.py
const DEFAULT_ALLOWED_EXTENSIONS = ['.md', '.pdf', '.txt'];
const DEFAULT_MAX_FILE_SIZE_MB = 10;

const USER_NAME = 'Researcher';
const ASSISTANT_NAME = 'AskMyDocs';

let idCounter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

export default function App() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Backend state
  const [isOnline, setIsOnline] = useState(true);
  const [geminiKeyLoaded, setGeminiKeyLoaded] = useState(true);
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  // Chat. Saved chats come from localStorage; the most recent one reopens on load.
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeChatId, setActiveChatId] = useState<string>(() => conversations[0]?.id ?? newId('c'));
  const [messages, setMessages] = useState<ChatMessage[]>(() => conversations[0]?.messages ?? []);
  // One AbortController per answer that is still loading, so Stop can cancel it
  const controllers = useRef(new Map<string, AbortController>());

  // Uploads
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Modals & toast
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewerTarget, setViewerTarget] = useState<ViewerTarget | null>(null);
  // Stable callbacks, so modals' key listeners don't re-subscribe every render
  const openPalette = useCallback(() => setIsCommandPaletteOpen(true), []);
  const closePalette = useCallback(() => setIsCommandPaletteOpen(false), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const closeViewer = useCallback(() => setViewerTarget(null), []);
  const [toast, setToast] = useState<{ message: string; action?: { label: string; run: () => void } } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, action?: { label: string; run: () => void }) => {
    setToast({ message, action });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), action ? 6000 : 3500);
  }, []);

  const allowedExtensions = config?.allowed_extensions ?? DEFAULT_ALLOWED_EXTENSIONS;
  const maxFileSizeMb = config?.max_file_size_mb ?? DEFAULT_MAX_FILE_SIZE_MB;
  const scopeLabel = (docId: string | null) =>
    docId === null ? 'all documents' : documents.find((d) => d.id === docId)?.name ?? 'this document';

  /** Any request that couldn't reach the server flips us into offline mode. */
  const noteError = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.isNetworkError) setIsOnline(false);
  }, []);

  // ---------- Loading data ----------

  const refreshDocuments = useCallback(async () => {
    try {
      const docs = (await api.listDocuments()).map(toDocumentItem);
      setDocuments(docs);
      setActiveDocId((current) => (current && docs.some((d) => d.id === current) ? current : null));
    } catch (e) {
      noteError(e);
      throw e;
    } finally {
      setDocumentsLoading(false);
    }
  }, [noteError]);

  /** Check the backend and (re)load everything. Used on start and while offline. */
  const connect = useCallback(async () => {
    try {
      const [health, cfg] = await Promise.all([api.health(), api.config()]);
      setGeminiKeyLoaded(health.gemini_key_loaded);
      setConfig(cfg);
      await refreshDocuments();
      setIsOnline(true);
    } catch (e) {
      setDocumentsLoading(false);
      if (e instanceof ApiError && e.isNetworkError) setIsOnline(false);
    }
  }, [refreshDocuments]);

  useEffect(() => {
    void connect();
  }, [connect]);

  // While online, check in every 30s so a stopped backend shows up as offline
  useEffect(() => {
    if (!isOnline) return;
    const timer = setInterval(() => {
      api.health().catch(noteError);
    }, 30000);
    return () => clearInterval(timer);
  }, [isOnline, noteError]);

  // ---------- Asking questions ----------

  const runAsk = useCallback(
    async (assistantId: string, question: string, docId: string | null) => {
      // Only touch the message if it's still in the open chat (the user may have switched chats)
      const update = (patch: Partial<ChatMessage>) =>
        setMessages((prev) =>
          prev.some((m) => m.id === assistantId)
            ? prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m))
            : prev,
        );

      const controller = new AbortController();
      controllers.current.set(assistantId, controller);
      try {
        const res = await api.ask(question, docId, controller.signal);
        update({
          status: res.answered ? 'answered' : 'not-found',
          content: res.answer,
          citations: res.sources.map(toCitation),
          timestamp: formatTime(),
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          update({ status: 'stopped', content: '', timestamp: formatTime() });
          return;
        }
        noteError(e);
        let content = e instanceof Error ? e.message : 'Unknown error.';
        if (e instanceof ApiError && e.status === 404) {
          content = 'The selected document no longer exists. Pick another document or ask across all documents.';
          void refreshDocuments().catch(() => {});
        }
        update({ status: 'error', content, timestamp: formatTime() });
      } finally {
        if (controllers.current.get(assistantId) === controller) controllers.current.delete(assistantId);
      }
    },
    [noteError, refreshDocuments],
  );

  const askQuestion = (question: string, docId: string | null = activeDocId) => {
    const assistantId = newId('a');
    const label = scopeLabel(docId);
    setMessages((prev) => [
      ...prev,
      {
        id: newId('u'),
        sender: 'user',
        senderName: USER_NAME,
        timestamp: formatTime(),
        content: question,
      },
      {
        id: assistantId,
        sender: 'assistant',
        senderName: ASSISTANT_NAME,
        timestamp: formatTime(),
        content: '',
        status: 'loading',
        question,
        scopeDocId: docId,
        scopeLabel: label,
      },
    ]);
    void runAsk(assistantId, question, docId);
  };

  const retryMessage = (message: ChatMessage) => {
    if (!message.question) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, status: 'loading', content: '', citations: [] } : m)),
    );
    void runAsk(message.id, message.question, message.scopeDocId ?? null);
  };

  const isAnswering = messages.some((m) => m.status === 'loading');

  /** Stop every answer that is still loading. The backend finishes its work, but the answer is discarded. */
  const stopAnswering = () => controllers.current.forEach((c) => c.abort());

  // ---------- Saved chats ----------

  // Save the open chat whenever its messages change. Opening a saved chat reuses the stored
  // array, so just viewing a chat doesn't move it to the top.
  useEffect(() => {
    if (messages.length === 0) return;
    setConversations((prev) =>
      prev.find((c) => c.id === activeChatId)?.messages === messages
        ? prev
        : upsertConversation(prev, activeChatId, messages),
    );
  }, [messages, activeChatId]);

  useEffect(() => saveConversations(conversations), [conversations]);

  /** Before leaving the open chat: cancel loading answers and save them as stopped. */
  const leaveCurrentChat = () => {
    stopAnswering();
    if (messages.some((m) => m.status === 'loading')) {
      const settled = messages.map((m) =>
        m.status === 'loading' ? { ...m, status: 'stopped' as const, content: '' } : m,
      );
      setConversations((prev) => upsertConversation(prev, activeChatId, settled));
    }
  };

  const startNewChat = () => {
    leaveCurrentChat();
    setActiveChatId(newId('c'));
    setMessages([]);
  };

  const selectChat = (id: string) => {
    if (id === activeChatId) return;
    const chat = conversations.find((c) => c.id === id);
    if (!chat) return;
    leaveCurrentChat();
    setActiveChatId(id);
    setMessages(chat.messages);
  };

  const deleteChat = (id: string) => {
    const chat = conversations.find((c) => c.id === id);
    if (!chat) return;
    if (id === activeChatId) {
      stopAnswering();
      setActiveChatId(newId('c'));
      setMessages([]);
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    showToast(`Deleted “${chat.title}”.`, {
      label: 'Undo',
      run: () => setConversations((prev) => [chat, ...prev.filter((c) => c.id !== id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))),
    });
  };

  const handleSend = (question: string) => {
    if (documents.length === 0) {
      showToast('Upload a document first, then ask questions about it.');
      openUploadPanel();
      return;
    }
    askQuestion(question);
  };

  // ---------- Uploads ----------

  const updateUpload = (id: string, patch: Partial<UploadItem>) =>
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const uploadFile = async (file: File) => {
    const id = newId('up');
    const base: UploadItem = { id, fileName: file.name, bytes: file.size, status: 'uploading', progress: 0 };
    const ext = extensionOf(file.name);

    // Same checks the backend does, so obvious problems don't need a round trip
    if (!allowedExtensions.includes(ext)) {
      setUploads((prev) => [
        {
          ...base,
          status: 'error',
          errorKind: 'unsupported',
          message: `Please upload ${allowedExtensions.map((e) => e.slice(1).toUpperCase()).join(', ')} files only.`,
        },
        ...prev,
      ]);
      return;
    }
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      setUploads((prev) => [
        { ...base, status: 'error', errorKind: 'too-large', message: 'Split or compress the file and try again.' },
        ...prev,
      ]);
      return;
    }

    setUploads((prev) => [base, ...prev]);
    try {
      const doc = await api.uploadDocument(
        file,
        (fraction) => updateUpload(id, { progress: fraction }),
        () => updateUpload(id, { status: 'processing', progress: 1 }),
      );
      updateUpload(id, {
        status: 'success',
        docId: doc.doc_id,
        chunkCount: doc.chunk_count,
        segmentCount: doc.segment_count,
      });
      showToast(`"${doc.filename}" is indexed and ready for questions.`);
      await refreshDocuments().catch(() => {});
    } catch (e) {
      noteError(e);
      if (e instanceof ApiError && e.status === 409) {
        const detail = (e.detail ?? {}) as { doc_id?: string; filename?: string };
        updateUpload(id, { status: 'duplicate', docId: detail.doc_id, existingName: detail.filename });
        return;
      }
      const status = e instanceof ApiError ? e.status : -1;
      updateUpload(id, {
        status: 'error',
        errorKind:
          status === 0 ? 'offline' : status === 413 ? 'too-large' : status === 422 ? 'unreadable' : 'other',
        message: e instanceof Error ? e.message : 'Upload failed.',
      });
    }
  };

  const handleFiles = (files: File[]) => {
    if (!files.length) return;
    setIsUploadPanelOpen(true);
    files.forEach((f) => void uploadFile(f));
  };

  const openUploadPanel = () => setIsUploadPanelOpen(true);
  const openFilePicker = () => fileInputRef.current?.click();

  // ---------- Deleting ----------

  const requestDelete = (doc: DocumentItem) => {
    setDeleteError(null);
    setDeleteTarget(doc);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteDocument(deleteTarget.id);
      showToast(`"${deleteTarget.name}" was deleted.`);
      setDeleteTarget(null);
      await refreshDocuments().catch(() => {});
    } catch (e) {
      noteError(e);
      if (e instanceof ApiError && e.status === 404) {
        // Already gone: just resync
        setDeleteTarget(null);
        await refreshDocuments().catch(() => {});
      } else {
        setDeleteError(e instanceof Error ? e.message : 'Could not delete this document.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------- Misc actions ----------

  const selectScope = (docId: string | null) => setActiveDocId(docId);

  const newChat = () => {
    startNewChat();
    void refreshDocuments().catch(() => {});
  };

  const chatList = (afterSelect?: () => void) => (
    <ChatHistoryList
      conversations={conversations}
      activeId={activeChatId}
      onSelect={(id) => {
        selectChat(id);
        afterSelect?.();
      }}
      onDelete={deleteChat}
    />
  );

  const openDocument = (doc: DocumentItem) => setViewerTarget({ docId: doc.id, docName: doc.name });
  const openCitation = (citation: SourceCitation) =>
    setViewerTarget({ docId: citation.docId, docName: citation.docName, citation });

  const copyText = (text: string, done: string) => {
    if (!navigator.clipboard) {
      showToast('Clipboard is not available in this browser.');
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => showToast(done),
      () => showToast('Could not copy to the clipboard.'),
    );
  };

  const conversationAsText = () =>
    messages
      .filter((m) => m.status !== 'loading')
      .map((m) => {
        if (m.sender === 'user') return `Q: ${m.content}`;
        const sources = (m.citations ?? [])
          .map((c) => `  [${c.id}] ${c.docName}${locationLabel(c) ? ` (${locationLabel(c)})` : ''}`)
          .join('\n');
        return `A: ${m.content}${sources ? `\n\nSources:\n${sources}` : ''}`;
      })
      .join('\n\n');

  const activeDocName = activeDocId === null ? null : documents.find((d) => d.id === activeDocId)?.name ?? null;

  // Citations in this conversation that point at the document about to be deleted
  const deleteTargetCitations = deleteTarget
    ? messages.reduce((n, m) => n + (m.citations ?? []).filter((c) => c.docId === deleteTarget.id).length, 0)
    : 0;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8F6F0] text-[#1C1D1B] font-sans">
      {!isOnline && <OfflineBanner onRetry={connect} />}

      {isOnline && !geminiKeyLoaded && (
        <div className="w-full bg-[#FEF2F2] border-b border-[#FECACA] text-[#9D0208] px-4 py-2 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            The backend has no <code className="font-mono font-bold">GEMINI_API_KEY</code>. Add it to{' '}
            <code className="font-mono">backend/.env</code> and restart the server, or uploads and questions will fail.
          </span>
        </div>
      )}

      {/* Hidden file input shared by every "upload" button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedExtensions.join(',')}
        className="hidden"
        onChange={(e) => {
          handleFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <TargetCorpusPanel
          documents={documents}
          isLoading={documentsLoading}
          activeDocId={activeDocId}
          onSelectDocument={selectScope}
          onAddDocument={openUploadPanel}
          onOpenDocument={openDocument}
          onDeleteDocument={requestDelete}
        >
          {chatList()}
        </TargetCorpusPanel>

        <main className="flex-1 flex flex-col min-w-0 bg-[#F8F6F0] relative overflow-hidden">
          <MainHeader
            scopeName={activeDocName}
            onClearScope={() => selectScope(null)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onNewChat={newChat}
            onCopyConversation={() => copyText(conversationAsText(), 'Conversation copied to clipboard.')}
            hasMessages={messages.length > 0}
            onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isOnline={isOnline}
          />

          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            {messages.length === 0 ? (
              <EmptyStateHero
                hasDocuments={documents.length > 0}
                scopeLabel={activeDocName ?? 'all your documents'}
                onUploadClick={openUploadPanel}
              />
            ) : (
              <ChatThread
                messages={messages}
                onJumpToPage={openCitation}
                onCopyResponse={(m) => copyText(m.content, 'Answer copied to clipboard.')}
                onRetry={retryMessage}
                onUploadClick={openUploadPanel}
                onSearchAllDocuments={(m) => m.question && askQuestion(m.question, null)}
              />
            )}
            <ChatInputBar
              placeholder={
                documents.length
                  ? `Ask a question about ${activeDocName ?? 'your documents'}...`
                  : 'Upload a document to start asking questions...'
              }
              isDisabled={!isOnline}
              isBusy={isAnswering}
              onSendMessage={handleSend}
              onStop={stopAnswering}
              onAttachClick={openUploadPanel}
            />
          </div>
        </main>
      </div>

      {/* Upload panel */}
      {isUploadPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div onClick={() => setIsUploadPanelOpen(false)} className="fixed inset-0 bg-black/45 backdrop-blur-xs"></div>
          <div className="relative z-10 w-full max-w-md">
            <UploadFeedbackGallery
              items={uploads}
              allowedExtensions={allowedExtensions}
              maxFileSizeMb={maxFileSizeMb}
              onChooseFiles={openFilePicker}
              onDropFiles={handleFiles}
              onDismissItem={(id) => setUploads((prev) => prev.filter((u) => u.id !== id))}
              onOpenDocument={(docId, docName) => {
                setIsUploadPanelOpen(false);
                setViewerTarget({ docId, docName });
              }}
              onClose={() => setIsUploadPanelOpen(false)}
            />
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirmDelete={confirmDelete}
        documentName={deleteTarget?.name}
        embeddingsCount={deleteTarget?.chunkCount ?? 0}
        citationsCount={deleteTargetCitations}
        isDeleting={isDeleting}
        errorMessage={deleteError}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[60] bg-[#1C1D1B] text-white px-4 py-2.5 rounded-lg text-xs shadow-lg flex items-center gap-2 border border-neutral-700 animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-[calc(100vw-3rem)]"
        >
          <Info className="w-3.5 h-3.5 text-[#C25E00] shrink-0" />
          <span className="min-w-0 break-words">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.run();
                setToast(null);
              }}
              className="ml-1 font-bold text-[#F4A261] hover:underline shrink-0 cursor-pointer"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onOpen={openPalette}
        onClose={closePalette}
        documents={documents}
        onUpload={openUploadPanel}
        onNewChat={newChat}
        onOpenDocument={openDocument}
        onOpenPassage={openCitation}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} config={config} />

      <DocumentPageViewerModal target={viewerTarget} onClose={closeViewer} />

      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        documents={documents}
        isLoading={documentsLoading}
        activeDocId={activeDocId}
        onSelectDocument={selectScope}
        onAddDocument={openUploadPanel}
        onOpenDocument={openDocument}
        onDeleteDocument={requestDelete}
        onOpenSettings={() => setIsSettingsOpen(true)}
        chatList={(closeDrawer) => chatList(closeDrawer)}
      />
    </div>
  );
}
