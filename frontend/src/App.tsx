/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SidebarRail } from './components/SidebarRail';
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
import { api, ApiConfig, ApiError } from './api';
import {
  ChatMessage,
  DocumentItem,
  NavTab,
  SourceCitation,
  UploadItem,
  formatTime,
  locationLabel,
  toCitation,
  toDocumentItem,
} from './types';
import { Folder, BookOpen, LineChart, Info, FileText, Trash2, UploadCloud, AlertTriangle, ArrowRight } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<NavTab>('research-chat');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Backend state
  const [isOnline, setIsOnline] = useState(true);
  const [geminiKeyLoaded, setGeminiKeyLoaded] = useState(true);
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  // Chat
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
  const [activeViewerCitation, setActiveViewerCitation] = useState<SourceCitation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const allowedExtensions = config?.allowed_extensions ?? DEFAULT_ALLOWED_EXTENSIONS;
  const maxFileSizeMb = config?.max_file_size_mb ?? DEFAULT_MAX_FILE_SIZE_MB;
  const totalChunks = documents.reduce((sum, d) => sum + d.chunkCount, 0);
  const scopeLabel = (docId: string | null) =>
    docId === null ? 'All Documents' : documents.find((d) => d.id === docId)?.name ?? 'this document';

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
      const update = (patch: Partial<ChatMessage>) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));

      try {
        const res = await api.ask(question, docId);
        update({
          status: res.answered ? 'answered' : 'not-found',
          content: res.answer,
          citations: res.sources.map(toCitation),
          timestamp: formatTime(),
        });
      } catch (e) {
        noteError(e);
        let content = e instanceof Error ? e.message : 'Unknown error.';
        if (e instanceof ApiError && e.status === 404) {
          content = 'The selected document no longer exists. Pick another document or ask across all documents.';
          void refreshDocuments().catch(() => {});
        }
        update({ status: 'error', content, timestamp: formatTime() });
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
    setActiveTab('research-chat');
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

  const selectScope = (docId: string | null) => {
    setActiveDocId(docId);
    showToast(`Scope: ${scopeLabel(docId)}`);
  };

  const clearConversation = () => {
    setMessages([]);
    void refreshDocuments().catch(() => {});
    showToast('Conversation cleared.');
  };

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
        if (m.sender === 'user') return `**Q:** ${m.content}`;
        const sources = (m.citations ?? [])
          .map((c) => `  [${c.id}] ${c.docName}${locationLabel(c) ? ` (${locationLabel(c)})` : ''}`)
          .join('\n');
        return `**A:** ${m.content}${sources ? `\n\nSources:\n${sources}` : ''}`;
      })
      .join('\n\n');

  const exportBibTeX = (message: ChatMessage) => {
    const byDoc = new Map<string, SourceCitation[]>();
    (message.citations ?? []).forEach((c) => byDoc.set(c.docId, [...(byDoc.get(c.docId) ?? []), c]));
    const year = new Date().getFullYear();
    const entries = [...byDoc.values()].map((cites) => {
      const name = cites[0].docName;
      const key = name.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9]+/g, '_').toLowerCase() || 'document';
      const pages = [...new Set(cites.map((c) => c.page).filter((p): p is number => p != null))].sort((a, b) => a - b);
      const lines = [`  title={${name}}`, `  year={${year}}`, `  note={Cited via AskMyDocs}`];
      if (pages.length) lines.splice(1, 0, `  pages={${pages.join(',')}}`);
      return `@misc{${key},\n${lines.join(',\n')}\n}`;
    });
    copyText(entries.join('\n\n'), 'BibTeX citation copied to clipboard!');
  };

  const handlePaletteAction = (action: string) => {
    if (action === 'toggle-open') setIsCommandPaletteOpen(true);
    else if (action === 'upload') openUploadPanel();
    else if (action === 'scope-all') selectScope(null);
    else if (action === 'clear-chat') clearConversation();
    else if (action.startsWith('scope:')) selectScope(action.slice('scope:'.length));
  };

  // Every citation shown in this conversation, for the Citations tab
  const allCitations = useMemo(
    () =>
      messages.flatMap((m) =>
        m.status === 'answered' ? (m.citations ?? []).map((c) => ({ citation: c, question: m.question ?? '' })) : [],
      ),
    [messages],
  );

  const stats = useMemo(() => {
    const finished = messages.filter((m) => m.sender === 'assistant' && m.status !== 'loading');
    const answered = finished.filter((m) => m.status === 'answered');
    const notFound = finished.filter((m) => m.status === 'not-found').length;
    const topMatches = answered
      .map((m) => Math.max(0, ...(m.citations ?? []).map((c) => c.matchScore)))
      .filter((v) => v > 0);
    const avgTop = topMatches.length ? Math.round(topMatches.reduce((a, b) => a + b, 0) / topMatches.length) : null;
    return { asked: finished.length, answered: answered.length, notFound, avgTop };
  }, [messages]);

  const backToChat = (
    <button
      onClick={() => setActiveTab('research-chat')}
      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#FFFFFF] border border-[#E2E0D8] text-[#1C1D1B]"
    >
      ← Back to Chat
    </button>
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8F6F0] text-[#1C1D1B] font-sans">
      {/* Server offline banner */}
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

      {/* Main Workspace Body (3-Column Layout) */}
      <div className="flex-1 flex overflow-hidden relative">
        <SidebarRail
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          verifiedChunksCount={totalChunks}
        />

        <TargetCorpusPanel
          documents={documents}
          isLoading={documentsLoading}
          activeDocId={activeDocId}
          onSelectDocument={selectScope}
          onAddDocument={openUploadPanel}
          onDeleteDocument={requestDelete}
          config={config}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-[#F8F6F0] relative overflow-hidden">
          <MainHeader
            currentScopeId={activeDocId}
            onScopeChange={selectScope}
            documents={documents}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenUserModal={() => setIsSettingsOpen(true)}
            onRefresh={clearConversation}
            onShare={() =>
              messages.length
                ? copyText(conversationAsText(), 'Conversation copied to clipboard!')
                : showToast('Ask a question first; there is nothing to share yet.')
            }
            onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
            isOnline={isOnline}
          />

          {activeTab === 'research-chat' ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              {messages.length === 0 ? (
                <EmptyStateHero
                  hasDocuments={documents.length > 0}
                  scopeLabel={scopeLabel(activeDocId)}
                  onSelectPrompt={(q) => askQuestion(q)}
                  onTriggerUploadClick={openUploadPanel}
                />
              ) : (
                <ChatThread
                  messages={messages}
                  onJumpToPage={setActiveViewerCitation}
                  onCopyResponse={(m) => copyText(m.content, 'Assistant answer copied to clipboard!')}
                  onExportBibTeX={exportBibTeX}
                  onShare={() => copyText(conversationAsText(), 'Conversation copied to clipboard!')}
                  onRetry={retryMessage}
                  onUploadClick={openUploadPanel}
                  onSearchAllDocuments={(m) => m.question && askQuestion(m.question, null)}
                />
              )}
              <ChatInputBar
                placeholder={
                  documents.length
                    ? `Ask a question about ${scopeLabel(activeDocId) === 'All Documents' ? 'your documents' : scopeLabel(activeDocId)}...`
                    : 'Upload a document to start asking questions...'
                }
                isDisabled={!isOnline}
                isBusy={isAnswering}
                onSendMessage={handleSend}
                onAttachClick={openUploadPanel}
              />
            </div>
          ) : activeTab === 'document-corpus' ? (
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-[#1C1D1B] flex items-center gap-2">
                    <Folder className="w-5 h-5 text-[#C25E00]" />
                    Document Corpus
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openUploadPanel}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#8A3E00] text-white hover:bg-[#723200]"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload
                    </button>
                    {backToChat}
                  </div>
                </div>
                <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-xl p-5 shadow-xs divide-y divide-[#E2E0D8]">
                  {documents.length === 0 ? (
                    <p className="text-xs text-[#656860] py-3">
                      {documentsLoading ? 'Loading documents...' : 'No documents uploaded yet.'}
                    </p>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-[#C25E00] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1C1D1B] truncate">{doc.name}</p>
                            <p className="text-[10px] font-mono text-[#656860]">
                              {doc.sizeFormatted} • {doc.date} • {doc.segmentCount}{' '}
                              {doc.type === 'pdf' ? 'pages' : 'sections'} • {doc.chunkCount} chunks
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setActiveDocId(doc.id);
                              setActiveTab('research-chat');
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C25E00] hover:underline"
                          >
                            Ask <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => requestDelete(doc)}
                            className="p-1.5 rounded text-[#656860] hover:text-[#9D0208] hover:bg-[#FEE2E2]"
                            title={`Delete ${doc.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'citations-sources' ? (
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-[#1C1D1B] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#C25E00]" />
                    Citations &amp; Sources
                  </h2>
                  {backToChat}
                </div>
                <div className="p-4 bg-white border border-[#E2E0D8] rounded-xl space-y-2">
                  <p className="text-xs text-[#1C1D1B] font-semibold">Strict Grounding</p>
                  <p className="text-xs text-[#656860]">
                    Every answer cites the passages it used as [n]. When no passage is similar enough
                    {config ? ` (at least ${Math.round((1 - config.retrieval_max_distance) * 100)}%)` : ''}, AskMyDocs
                    says it couldn't find the answer instead of guessing.
                  </p>
                </div>
                {allCitations.length === 0 ? (
                  <p className="text-xs text-[#656860]">Citations from your answers in this conversation will show up here.</p>
                ) : (
                  <div className="space-y-2.5">
                    {allCitations.map(({ citation, question }, i) => (
                      <div key={i} className="p-3.5 bg-white border border-[#E2E0D8] border-l-4 border-l-[#C25E00] rounded-lg space-y-2">
                        <div className="flex items-center justify-between gap-2 font-mono text-xs">
                          <span className="font-bold text-[#1C1D1B] truncate">
                            {citation.docName}
                            {locationLabel(citation) && <span className="text-[#656860]"> • {locationLabel(citation)}</span>}
                          </span>
                          <span className="text-[10px] text-[#656860] shrink-0">{citation.matchScore}% match</span>
                        </div>
                        <p className="text-[11px] text-[#656860]">
                          For: <span className="italic">“{question}”</span>
                        </p>
                        <p className="font-mono text-xs text-[#1C1D1B] bg-[#F8F6F0] p-2.5 rounded border border-[#E2E0D8]">
                          “{citation.snippet}{citation.snippet.length >= 200 ? "…" : ""}”
                        </p>
                        <button
                          onClick={() => setActiveViewerCitation(citation)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#C25E00] hover:underline"
                        >
                          View in document <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-[#1C1D1B] flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-[#C25E00]" />
                    Analytics &amp; Scope
                  </h2>
                  {backToChat}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Documents', value: documents.length.toLocaleString() },
                    { label: 'Indexed chunks', value: totalChunks.toLocaleString() },
                    { label: 'Questions answered', value: `${stats.answered} / ${stats.asked}` },
                    { label: 'Avg. top match', value: stats.avgTop === null ? '—' : `${stats.avgTop}%` },
                  ].map((s) => (
                    <div key={s.label} className="p-4 bg-white border border-[#E2E0D8] rounded-lg">
                      <p className="text-[11px] text-[#656860]">{s.label}</p>
                      <p className="text-2xl font-bold font-mono text-[#1C1D1B] mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-white border border-[#E2E0D8] rounded-lg text-xs text-[#656860] space-y-1">
                  <p>
                    Current scope: <strong className="text-[#1C1D1B]">{scopeLabel(activeDocId)}</strong>
                  </p>
                  <p>
                    Not found in documents: <strong className="text-[#1C1D1B]">{stats.notFound}</strong> question
                    {stats.notFound === 1 ? '' : 's'} this session.
                  </p>
                  {config && (
                    <p>
                      Retrieval: top {config.retrieval_k} passages, min. similarity{' '}
                      {Math.round((1 - config.retrieval_max_distance) * 100)}%, model{' '}
                      <code className="font-mono">{config.chat_model}</code>.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
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
              onViewExisting={(docId) => {
                setIsUploadPanelOpen(false);
                setActiveDocId(docId);
                setActiveTab('research-chat');
                showToast(`Scope: ${scopeLabel(docId)}`);
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
        citationsCount={allCitations.filter((c) => c.citation.docId === deleteTarget?.id).length}
        isDeleting={isDeleting}
        errorMessage={deleteError}
      />

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[60] bg-[#1C1D1B] text-white px-4 py-2.5 rounded-lg text-xs shadow-lg flex items-center gap-2 border border-neutral-700 animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-[calc(100vw-3rem)]">
          <Info className="w-3.5 h-3.5 text-[#C25E00] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={handlePaletteAction}
        documents={documents}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} config={config} />

      <DocumentPageViewerModal
        isOpen={Boolean(activeViewerCitation)}
        onClose={() => setActiveViewerCitation(null)}
        citation={activeViewerCitation}
      />

      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        documents={documents}
        activeDocId={activeDocId}
        onSelectDocument={selectScope}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddDocument={openUploadPanel}
        onDeleteDocument={requestDelete}
        minSimilarityPercent={config ? Math.round((1 - config.retrieval_max_distance) * 100) : undefined}
        retrievalK={config?.retrieval_k}
      />
    </div>
  );
}
