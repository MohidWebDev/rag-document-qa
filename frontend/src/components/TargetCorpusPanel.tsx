import React from 'react';
import { FileText, Plus, Layers, Trash2, Library, Loader2, BookOpen } from 'lucide-react';
import { DocumentItem, plural } from '../types';

interface TargetCorpusPanelProps {
  documents: DocumentItem[];
  isLoading?: boolean;
  /** Selected doc_id, or null for "all documents" */
  activeDocId: string | null;
  onSelectDocument: (docId: string | null) => void;
  onAddDocument: () => void;
  onOpenDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (doc: DocumentItem) => void;
}

/** The one place to choose which documents questions search. */
export const DocumentList: React.FC<TargetCorpusPanelProps> = ({
  documents,
  isLoading = false,
  activeDocId,
  onSelectDocument,
  onAddDocument,
  onOpenDocument,
  onDeleteDocument,
}) => {
  const totalChunks = documents.reduce((sum, d) => sum + d.chunkCount, 0);
  const allActive = activeDocId === null;

  const rowClass = (active: boolean) =>
    `group p-2.5 rounded-lg cursor-pointer transition-colors ${
      active
        ? 'bg-[#FFFFFF] border-l-3 border-l-[#C25E00] border-y border-r border-[#E2E0D8] shadow-2xs'
        : 'bg-[#F8F6F0] hover:bg-[#FFFFFF] border border-[#E2E0D8]'
    }`;

  return (
    <div className="space-y-2">
      {documents.length > 0 && (
        <div onClick={() => onSelectDocument(null)} className={rowClass(allActive)} aria-pressed={allActive} role="button">
          <div className="flex items-center gap-2">
            <Library className={`w-3.5 h-3.5 shrink-0 ${allActive ? 'text-[#C25E00]' : 'text-[#656860]'}`} />
            <div className="min-w-0">
              <p className={`text-xs text-[#1C1D1B] ${allActive ? 'font-bold' : 'font-medium'}`}>All documents</p>
              <p className="text-[10px] font-mono text-[#656860]">{plural(totalChunks, 'chunk')}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading && documents.length === 0 && (
        <div className="p-3 flex items-center gap-2 text-[11px] font-mono text-[#656860]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading documents...
        </div>
      )}

      {!isLoading && documents.length === 0 && (
        <p className="p-3 text-[11px] text-[#656860] leading-snug border border-dashed border-[#E2E0D8] rounded-lg">
          No documents yet. Upload a PDF, Markdown or text file to start asking questions.
        </p>
      )}

      {documents.map((doc) => {
        const isActive = doc.id === activeDocId;
        return (
          <div key={doc.id} onClick={() => onSelectDocument(doc.id)} className={rowClass(isActive)} aria-pressed={isActive} role="button">
            <div className="flex items-start gap-2">
              <FileText className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? 'text-[#C25E00]' : 'text-[#656860]'}`} />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs text-[#1C1D1B] break-words line-clamp-2 ${isActive ? 'font-bold' : 'font-medium'}`}
                  title={doc.name}
                >
                  {doc.name}
                </p>
                <p className="text-[10px] font-mono text-[#656860]">
                  {plural(doc.chunkCount, 'chunk')} • {doc.sizeFormatted} • {doc.date}
                </p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDocument(doc);
                  }}
                  className="p-1 rounded text-[#656860] hover:text-[#C25E00] hover:bg-[#FAF0E6] cursor-pointer"
                  title={`Read ${doc.name}`}
                  aria-label={`Read ${doc.name}`}
                >
                  <BookOpen className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDocument(doc);
                  }}
                  className="p-1 rounded text-[#656860] hover:text-[#9D0208] hover:bg-[#FEE2E2] cursor-pointer"
                  title={`Delete ${doc.name}`}
                  aria-label={`Delete ${doc.name}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <button
        onClick={onAddDocument}
        className="w-full py-2 bg-[#EFEAE1] hover:bg-[#EAE4D8] border border-[#E2E0D8] rounded-lg text-xs font-bold text-[#1C1D1B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Document</span>
      </button>
    </div>
  );
};

export const TargetCorpusPanel: React.FC<TargetCorpusPanelProps> = (props) => (
  <aside className="hidden lg:flex w-[280px] shrink-0 h-full bg-[#F8F6F0] border-r border-[#E2E0D8] p-3 flex-col select-none overflow-y-auto">
    <div className="space-y-1.5 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#C25E00]" />
          <h3 className="text-sm font-bold text-[#1C1D1B]">Documents</h3>
        </div>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#EFEAE1] text-[#656860] font-bold border border-[#E2E0D8]">
          {props.documents.length}
        </span>
      </div>
      <p className="text-[11px] text-[#656860] leading-snug">
        Click a document to ask only about it, or “All documents” to search everything.
      </p>
    </div>
    <DocumentList {...props} />
  </aside>
);
