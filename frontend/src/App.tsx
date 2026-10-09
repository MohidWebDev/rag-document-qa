/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SidebarRail } from './components/SidebarRail';
import { TargetCorpusPanel } from './components/TargetCorpusPanel';
import { MainHeader } from './components/MainHeader';
import { OfflineBanner } from './components/OfflineBanner';
import { ModalFeedbackOverlayGallery } from './components/ModalFeedbackOverlayGallery';
import { MobileDrawer } from './components/MobileDrawer';
import { ChatStateVariants } from './components/ChatStateVariants';
import { ChatThread } from './components/ChatThread';
import { ChatInputBar } from './components/ChatInputBar';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { DocumentPageViewerModal } from './components/DocumentPageViewerModal';
import {
  DocumentItem,
  NavTab,
  SourceCitation
} from './types';
import {
  Folder,
  BookOpen,
  LineChart,
  Info,
  CheckCircle2,
  FileText,
  Sliders,
  Trash2,
  UploadCloud
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('research-chat');
  const [viewMode, setViewMode] = useState<'modal-gallery' | 'variants' | 'single-thread'>('modal-gallery');
  const [isModalGalleryOpen, setIsModalGalleryOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // Initial 3 documents specified in prompt
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 'doc-1',
      name: 'Q3_Financial_Report.pdf',
      sizeFormatted: '4.2 MB',
      date: 'Oct 4',
      type: 'pdf',
      bytes: 4.2 * 1024 * 1024,
    },
    {
      id: 'doc-2',
      name: 'meeting_notes.md',
      sizeFormatted: '312 KB',
      date: 'Oct 6',
      type: 'md',
      bytes: 312 * 1024,
    },
    {
      id: 'doc-3',
      name: 'project_roadmap.txt',
      sizeFormatted: '98 KB',
      date: 'Oct 7',
      type: 'txt',
      bytes: 98 * 1024,
    },
  ]);

  const [activeDocumentName, setActiveDocumentName] = useState<string>('Q3_Financial_Report.pdf');
  const [currentScope, setCurrentScope] = useState<string>('Q3_Financial_Report.pdf');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeViewerCitation, setActiveViewerCitation] = useState<SourceCitation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleForceRetryServer = () => {
    showToast('Re-establishing socket connection to vector index cluster sfo-02...');
    setTimeout(() => {
      showToast('Heartbeat restored. Server status: Nominal.');
    }, 1200);
  };

  const handleConfirmDelete = () => {
    setDocuments((prev) => prev.filter((d) => d.name !== 'Q3_Financial_Report.pdf'));
    setIsModalGalleryOpen(false);
    showToast('Document "Q3_Financial_Report.pdf" successfully deleted from corpus.');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8F6F0] text-[#1C1D1B] font-sans">
      {/* 1. Top Pinned Server Offline Banner */}
      {showOfflineBanner && (
        <OfflineBanner
          onForceRetry={handleForceRetryServer}
        />
      )}

      {/* Main Workspace Body (3-Column Layout) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leftmost Rail */}
        <SidebarRail
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          verifiedChunksCount={1816}
        />

        {/* Middle Column: Target Corpus Panel */}
        <TargetCorpusPanel
          activeDocName={activeDocumentName}
          onSelectDocument={(name) => {
            setActiveDocumentName(name);
            setCurrentScope(name);
            showToast(`Active scope: ${name}`);
          }}
          onAddDocument={() => {
            setIsModalGalleryOpen(true);
            showToast('Showing upload pipeline feedback gallery');
          }}
        />

        {/* Right Area: Main Workspace Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F8F6F0] relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col">
            <MainHeader
              currentScope={currentScope}
              onScopeChange={(scope) => {
                setCurrentScope(scope);
                showToast(`Scope set to ${scope}`);
              }}
              documents={documents}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenUserModal={() => setIsSettingsOpen(true)}
              onRefresh={() => showToast('Re-indexing vector embeddings...')}
              onShare={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast('Share link copied to clipboard!');
              }}
              onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
            />

            {/* Quick View Switcher Sub-bar with horizontal scroll on mobile */}
            <div className="px-3 sm:px-6 py-1.5 bg-[#FAF8F5] border-b border-[#E2E0D8]/80 flex items-center justify-between text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="text-[10.5px] sm:text-[11px] font-mono text-[#656860]">VIEW:</span>
                <button
                  onClick={() => {
                    setViewMode('modal-gallery');
                    setIsModalGalleryOpen(true);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] sm:text-xs font-mono font-medium transition-colors ${
                    isModalGalleryOpen
                      ? 'bg-[#9D0208] text-white shadow-2xs'
                      : 'bg-white border border-[#E2E0D8] text-[#1C1D1B] hover:bg-[#F8F6F0]'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Modal &amp; Upload Feedback</span>
                </button>

                <button
                  onClick={() => {
                    setViewMode('variants');
                    setIsModalGalleryOpen(false);
                  }}
                  className={`px-2.5 py-0.5 rounded text-[11px] sm:text-xs font-mono font-medium transition-colors ${
                    !isModalGalleryOpen && viewMode === 'variants'
                      ? 'bg-[#8A3E00] text-white'
                      : 'bg-white border border-[#E2E0D8] text-[#1C1D1B] hover:bg-[#F8F6F0]'
                  }`}
                >
                  4 Chat State Variants
                </button>

                <button
                  onClick={() => {
                    setViewMode('single-thread');
                    setIsModalGalleryOpen(false);
                  }}
                  className={`px-2.5 py-0.5 rounded text-[11px] sm:text-xs font-mono font-medium transition-colors ${
                    !isModalGalleryOpen && viewMode === 'single-thread'
                      ? 'bg-[#8A3E00] text-white'
                      : 'bg-white border border-[#E2E0D8] text-[#1C1D1B] hover:bg-[#F8F6F0]'
                  }`}
                >
                  Verified Chat Synthesis
                </button>
              </div>

              <div className="flex items-center gap-2 pl-2 shrink-0">
                {!isModalGalleryOpen && (
                  <button
                    onClick={() => setIsModalGalleryOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FAF0E6] text-[#9D0208] border border-[#F0D5BE] font-mono text-[10.5px] sm:text-[11px] font-bold hover:bg-[#FBE2D2] cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Open Delete Modal</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Body Content Underneath Overlay */}
          {activeTab === 'research-chat' ? (
            viewMode === 'variants' ? (
              <ChatStateVariants
                onRetryRequest={() => showToast('Re-dispatching vector retrieval...')}
                onUploadWarrantyDoc={() => setIsModalGalleryOpen(true)}
                onRephraseQuery={() => showToast('Rephrasing query...')}
              />
            ) : (
              <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                <ChatThread
                  onJumpToPage={(citation) => setActiveViewerCitation(citation)}
                  onCopyResponse={() => showToast('Assistant answer copied to clipboard!')}
                  onExportBibTeX={() => {
                    const bibtex = `@techreport{askmydocs_q3,\n  title={Q3 Corporate Financial Report},\n  author={AskMyDocs Extraction Engine},\n  year={2026}\n}`;
                    navigator.clipboard?.writeText(bibtex);
                    showToast('BibTeX citation copied to clipboard!');
                  }}
                  onShare={() => showToast('Share link copied to clipboard!')}
                />
                <ChatInputBar
                  placeholder="Ask a question about this document or synthesized corpus..."
                  onSendMessage={(msg) => showToast(`Sent query: "${msg}"`)}
                />
              </div>
            )
          ) : activeTab === 'document-corpus' ? (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1C1D1B] flex items-center gap-2">
                    <Folder className="w-5 h-5 text-[#C25E00]" />
                    Document Corpus Repository
                  </h2>
                  <button
                    onClick={() => setActiveTab('research-chat')}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#FFFFFF] border border-[#E2E0D8] text-[#1C1D1B]"
                  >
                    ← Back to Chat
                  </button>
                </div>
                <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-xl p-5 shadow-xs divide-y divide-[#E2E0D8]">
                  {documents.map((doc) => (
                    <div key={doc.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#C25E00]" />
                        <div>
                          <p className="text-xs font-bold text-[#1C1D1B]">{doc.name}</p>
                          <p className="text-[10px] font-mono text-[#656860]">{doc.sizeFormatted} • {doc.date}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-emerald-700 font-bold">100% Vectorized</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'citations-sources' ? (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1C1D1B] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#C25E00]" />
                    Citation Verification Framework
                  </h2>
                  <button
                    onClick={() => setActiveTab('research-chat')}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#FFFFFF] border border-[#E2E0D8] text-[#1C1D1B]"
                  >
                    ← Back to Chat
                  </button>
                </div>
                <div className="p-4 bg-white border border-[#E2E0D8] rounded-xl space-y-2">
                  <p className="text-xs text-[#1C1D1B] font-semibold">Strict Grounding Protocol Active</p>
                  <p className="text-xs text-[#656860]">
                    In State B (Not Found), when matching score falls below the 80% confidence floor, AskMyDocs guarantees zero hallucinations and outputs a transparent Provenance Audit Record rather than inventing answers.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1C1D1B] flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-[#C25E00]" />
                    Analytics &amp; Scope
                  </h2>
                  <button
                    onClick={() => setActiveTab('research-chat')}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#FFFFFF] border border-[#E2E0D8] text-[#1C1D1B]"
                  >
                    ← Back to Chat
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-white border border-[#E2E0D8] rounded-lg">
                    <p className="text-[11px] text-[#656860]">Confidence Floor</p>
                    <p className="text-2xl font-bold font-mono text-[#1C1D1B] mt-1">99.8%</p>
                  </div>
                  <div className="p-4 bg-white border border-[#E2E0D8] rounded-lg">
                    <p className="text-[11px] text-[#656860]">Hallucination Risk</p>
                    <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">0%</p>
                  </div>
                  <div className="p-4 bg-white border border-[#E2E0D8] rounded-lg">
                    <p className="text-[11px] text-[#656860]">Corpus Context</p>
                    <p className="text-2xl font-bold font-mono text-[#1C1D1B] mt-1">1,816</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 2. THE MODAL OVERLAY & UPLOAD FEEDBACK STATE GALLERY (Centered over dimmed workspace background) */}
        <ModalFeedbackOverlayGallery
          isOpen={isModalGalleryOpen}
          onClose={() => setIsModalGalleryOpen(false)}
          onConfirmDelete={handleConfirmDelete}
          documentName="Q3_Financial_Report.pdf"
          embeddingsCount={1420}
          citationsCount={14}
          onViewExisting={(doc) => {
            setIsModalGalleryOpen(false);
            showToast(`Navigated to existing file: ${doc}`);
          }}
        />
      </div>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1D1B] text-white px-4 py-2.5 rounded-lg text-xs shadow-lg flex items-center gap-2 border border-neutral-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Info className="w-3.5 h-3.5 text-[#C25E00] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Command Palette Modal (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={() => showToast('Action performed.')}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Document Page Viewer Modal */}
      <DocumentPageViewerModal
        isOpen={Boolean(activeViewerCitation)}
        onClose={() => setActiveViewerCitation(null)}
        citation={activeViewerCitation}
      />

      {/* Mobile Workspace Slide-over Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        documents={documents}
        activeDocName={activeDocumentName}
        onSelectDocument={(name) => {
          setActiveDocumentName(name);
          setCurrentScope(name);
          showToast(`Active scope: ${name}`);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddDocument={() => {
          setIsModalGalleryOpen(true);
          showToast('Showing upload feedback pipeline');
        }}
      />
    </div>
  );
}
