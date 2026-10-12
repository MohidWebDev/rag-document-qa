import React from 'react';
import { FileText, Search, Radio, Copy, MessageSquarePlus, X, Library, Settings } from 'lucide-react';

interface MainHeaderProps {
  /** Name of the document questions are limited to, or null for all documents */
  scopeName: string | null;
  onClearScope: () => void;
  onOpenCommandPalette: () => void;
  onNewChat: () => void;
  onCopyConversation: () => void;
  hasMessages: boolean;
  onToggleMobileDrawer: () => void;
  onOpenSettings: () => void;
  isOnline: boolean;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  scopeName,
  onClearScope,
  onOpenCommandPalette,
  onNewChat,
  onCopyConversation,
  hasMessages,
  onToggleMobileDrawer,
  onOpenSettings,
  isOnline,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="w-full bg-[#FFFFFF] border-b border-[#E2E0D8] select-none">
      {/* Top bar */}
      <div className="h-14 px-3 sm:px-6 flex items-center justify-between border-b border-[#E2E0D8]/60">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={onToggleMobileDrawer}
            className="lg:hidden p-1.5 rounded-lg text-[#1C1D1B] hover:bg-[#F8F6F0] transition-colors cursor-pointer"
            aria-label="Open documents and navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="w-7 h-7 rounded-md bg-[#FAF0E6] border border-[#F0D5BE] flex items-center justify-center text-[#C25E00] shrink-0">
            <FileText className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#1C1D1B]">AskMyDocs</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#1C1D1B] font-medium">
            <Radio className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-600' : 'text-[#9D0208]'}`} />
            <span className="hidden sm:inline">{isOnline ? 'Server connected' : 'Server offline'}</span>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-[#656860] hover:text-[#1C1D1B] hover:bg-[#F8F6F0] transition-colors cursor-pointer"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="h-11 px-3 sm:px-6 bg-[#FBF9F5] flex items-center justify-between gap-2 text-xs text-[#656860]">
        <div className="flex items-center gap-2 min-w-0">
          {/* What the next question will search. Pick a document in the left panel (or the menu on mobile). */}
          <div
            className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 bg-[#FFFFFF] border border-[#E2E0D8] rounded-md text-xs text-[#1C1D1B] shadow-2xs min-w-0"
            title={scopeName ? `Questions only search ${scopeName}` : 'Questions search all documents'}
          >
            {scopeName ? (
              <FileText className="w-3.5 h-3.5 text-[#C25E00] shrink-0" />
            ) : (
              <Library className="w-3.5 h-3.5 text-[#656860] shrink-0" />
            )}
            <span className="text-[#656860] shrink-0">Asking:</span>
            <span className="font-medium truncate max-w-[110px] sm:max-w-[260px]">{scopeName ?? 'All documents'}</span>
            {scopeName ? (
              <button
                onClick={onClearScope}
                className="p-0.5 rounded text-[#656860] hover:text-[#1C1D1B] hover:bg-[#EFECE6] cursor-pointer shrink-0"
                title="Ask across all documents instead"
                aria-label="Ask across all documents instead"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <span className="w-1" />
            )}
          </div>

          <button
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#FFFFFF] border border-[#E2E0D8] text-[11px] text-[#656860] hover:text-[#1C1D1B] hover:border-[#C25E00]/40 transition-colors cursor-pointer shadow-2xs shrink-0"
            title="Search inside your documents"
          >
            <Search className="w-3 h-3" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden md:inline font-mono text-[10px] px-1 rounded border border-[#E2E0D8] bg-[#F8F6F0]">
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onCopyConversation}
            disabled={!hasMessages}
            className="p-1.5 rounded text-[#656860] hover:text-[#1C1D1B] hover:bg-[#EFECE6] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent"
            title="Copy the conversation as text"
            aria-label="Copy the conversation as text"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNewChat}
            disabled={!hasMessages}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[#1C1D1B] hover:bg-[#EFECE6] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent"
            title="Clear the conversation and start over"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">New chat</span>
          </button>
        </div>
      </div>
    </header>
  );
};
