import React from 'react';
import { X, FileText, Settings } from 'lucide-react';
import { DocumentItem } from '../types';
import { DocumentList } from './TargetCorpusPanel';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  isLoading: boolean;
  /** Selected doc_id, or null for all documents */
  activeDocId: string | null;
  onSelectDocument: (docId: string | null) => void;
  onAddDocument: () => void;
  onOpenDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (doc: DocumentItem) => void;
  onOpenSettings: () => void;
  /** The chat list; rendered below the documents */
  chatList?: (closeDrawer: () => void) => React.ReactNode;
}

/** Below the lg breakpoint the documents panel is hidden; this drawer shows the same list. */
export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  documents,
  isLoading,
  activeDocId,
  onSelectDocument,
  onAddDocument,
  onOpenDocument,
  onDeleteDocument,
  onOpenSettings,
  chatList,
}) => {
  if (!isOpen) return null;

  // Every action also closes the drawer
  const then = <T,>(fn: (arg: T) => void) => (arg: T) => {
    fn(arg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      <div onClick={onClose} className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"></div>

      <div className="relative w-4/5 max-w-xs bg-[#F8F6F0] border-r border-[#E2E0D8] shadow-2xl h-full flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-200 select-none overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E0D8]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#FAF0E6] border border-[#F0D5BE] flex items-center justify-center text-[#C25E00]">
                <FileText className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-bold text-base tracking-tight text-[#1C1D1B]">Documents</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#656860] hover:text-[#1C1D1B] hover:bg-[#EFECE6]"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-[#656860] leading-snug">
            Tap a document to ask only about it, or “All documents” to search everything.
          </p>

          <DocumentList
            documents={documents}
            isLoading={isLoading}
            activeDocId={activeDocId}
            onSelectDocument={then(onSelectDocument)}
            onAddDocument={then<void>(onAddDocument)}
            onOpenDocument={then(onOpenDocument)}
            onDeleteDocument={then(onDeleteDocument)}
          />

          {chatList && <div className="pt-4 border-t border-[#E2E0D8]">{chatList(onClose)}</div>}
        </div>

        <div className="pt-3 border-t border-[#E2E0D8] mt-4">
          <button
            onClick={() => then<void>(onOpenSettings)()}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1C1D1B] hover:bg-[#EFECE6] rounded-lg text-left"
          >
            <Settings className="w-4 h-4 text-[#656860]" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
