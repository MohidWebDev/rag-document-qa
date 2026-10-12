import React from 'react';
import { FileText, Plus, Check, ShieldCheck, Layers, Trash2, Library, Loader2 } from 'lucide-react';
import { DocumentItem } from '../types';
import type { ApiConfig } from '../api';

interface TargetCorpusPanelProps {
  documents: DocumentItem[];
  isLoading?: boolean;
  /** Selected doc_id, or null for "all documents" */
  activeDocId: string | null;
  onSelectDocument: (docId: string | null) => void;
  onAddDocument: () => void;
  onDeleteDocument: (doc: DocumentItem) => void;
  config: ApiConfig | null;
}

export const TargetCorpusPanel: React.FC<TargetCorpusPanelProps> = ({
  documents,
  isLoading = false,
  activeDocId,
  onSelectDocument,
  onAddDocument,
  onDeleteDocument,
  config,
}) => {
  const totalChunks = documents.reduce((sum, d) => sum + d.chunkCount, 0);
  const allActive = activeDocId === null;

  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 h-full bg-[#F8F6F0] border-r border-[#E2E0D8] p-3 flex-col justify-between select-none overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#C25E00]" />
              <h3 className="text-sm font-bold text-[#1C1D1B]">Target Corpus</h3>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#E5EFE8] text-[#1E5631] font-bold border border-[#C6DEC9]">
              {documents.length} doc{documents.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-[11px] text-[#656860] leading-snug">
            Pick a document to limit answers to it, or search across all of them.
          </p>
        </div>

        {/* Documents Stack */}
        <div className="space-y-2">
          {documents.length > 0 && (
            <div
              onClick={() => onSelectDocument(null)}
              className={`p-2.5 rounded-lg cursor-pointer transition-colors ${
                allActive
                  ? 'bg-[#FFFFFF] border-l-3 border-l-[#C25E00] border-y border-r border-[#E2E0D8] shadow-2xs'
                  : 'bg-[#F8F6F0] hover:bg-[#FFFFFF] border border-[#E2E0D8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Library className={`w-3.5 h-3.5 ${allActive ? 'text-[#C25E00]' : 'text-[#656860]'}`} />
                  <div>
                    <p className={`text-xs text-[#1C1D1B] ${allActive ? 'font-bold' : 'font-medium'}`}>All Documents</p>
                    <p className="text-[10px] font-mono text-[#656860]">{totalChunks.toLocaleString()} chunks</p>
                  </div>
                </div>
                {allActive && (
                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FAF0E6] text-[#C25E00] border border-[#F0D5BE]">
                    ACTIVE
                  </span>
                )}
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
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                className={`group p-2.5 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#FFFFFF] border-l-3 border-l-[#C25E00] border-y border-r border-[#E2E0D8] shadow-2xs'
                    : 'bg-[#F8F6F0] hover:bg-[#FFFFFF] border border-[#E2E0D8]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#C25E00]' : 'text-[#656860]'}`} />
                    <div className="min-w-0">
                      <p
                        className={`text-xs text-[#1C1D1B] truncate ${isActive ? 'font-bold' : 'font-medium'}`}
                        title={doc.name}
                      >
                        {doc.name}
                      </p>
                      <p className="text-[10px] font-mono text-[#656860]">
                        {doc.chunkCount.toLocaleString()} chunks • {doc.sizeFormatted}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(doc);
                      }}
                      className="p-1 rounded text-[#656860] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-[#9D0208] hover:bg-[#FEE2E2] transition-all cursor-pointer"
                      title={`Delete ${doc.name}`}
                      aria-label={`Delete ${doc.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {isActive ? (
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FAF0E6] text-[#C25E00] border border-[#F0D5BE]">
                        ACTIVE
                      </span>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
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

        {/* Index stats */}
        <div className="p-3 bg-[#EFEAE1]/60 rounded-lg border border-[#E2E0D8] space-y-1.5 font-mono text-[10px] text-[#656860]">
          <div className="flex justify-between">
            <span>Indexed chunks</span>
            <span className="font-bold text-[#1C1D1B]">{totalChunks.toLocaleString()}</span>
          </div>
          {config && (
            <>
              <div className="flex justify-between">
                <span>Chunk size</span>
                <span className="font-bold text-[#1C1D1B]">
                  {config.chunk_size} chars (+{config.chunk_overlap})
                </span>
              </div>
              <p className="text-[9.5px] text-[#656860] pt-0.5">
                Vector dimension: {config.embed_dimensions.toLocaleString()} (Cosine sim)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Strict Grounding Summary */}
      <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E2E0D8] shadow-2xs mt-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1D1B]">
          <ShieldCheck className="w-4 h-4 text-[#C25E00]" />
          <span>Strict Grounding</span>
        </div>
        <p className="text-[10.5px] text-[#656860] leading-snug">
          Answers come only from your documents. If no passage is similar enough, AskMyDocs says it couldn't find
          the answer instead of guessing.
        </p>

        {config && (
          <div className="pt-2 border-t border-[#E2E0D8] grid grid-cols-2 gap-2 text-left font-mono">
            <div>
              <p className="text-base font-bold text-[#1C1D1B]">
                {Math.round((1 - config.retrieval_max_distance) * 100)}%
              </p>
              <p className="text-[9.5px] text-[#656860]">Min. similarity</p>
            </div>
            <div>
              <p className="text-base font-bold text-emerald-700">{config.retrieval_k}</p>
              <p className="text-[9.5px] text-[#656860]">Passages per question</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
