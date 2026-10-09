import React from 'react';
import { X, FileText, Download, ExternalLink, BookmarkCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { SourceCitation } from '../types';

interface DocumentPageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: SourceCitation | null;
}

export const DocumentPageViewerModal: React.FC<DocumentPageViewerModalProps> = ({
  isOpen,
  onClose,
  citation,
}) => {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      <div className="w-full max-w-2xl bg-[#FFFFFF] rounded-2xl border border-[#E2E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-3 sm:p-3.5 bg-[#FAF8F5] border-b border-[#E2E0D8] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-[#FAF0E6] border border-[#F0D5BE] flex items-center justify-center text-[#C25E00] shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1C1D1B] flex items-center gap-1.5 truncate">
                <span className="truncate">{citation.docName}</span>
                <span className="font-mono text-[10px] text-[#656860] px-1.5 py-0.2 rounded bg-white border border-[#E2E0D8] shrink-0">
                  P.{citation.page}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-[9.5px] sm:text-[10px] font-semibold text-[#8A4A00] bg-[#FAF3EA] border border-[#8A4A00] px-1.5 sm:px-2 py-0.5 rounded">
              Citation [{citation.id}]
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#656860] hover:text-[#1C1D1B] hover:bg-[#EFECE6] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Page Simulation Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#F8F6F0] space-y-4 font-serif text-xs sm:text-sm leading-relaxed text-[#1C1D1B]">
          <div className="max-w-xl mx-auto bg-[#FFFFFF] p-4 sm:p-8 shadow-xs border border-[#E2E0D8] rounded-lg space-y-4">
            <div className="flex justify-between items-center text-[11px] sm:text-xs font-sans text-[#656860] border-b border-neutral-100 pb-2">
              <span className="font-mono uppercase tracking-wider truncate">{citation.section} • Financial Operations</span>
              <span className="font-mono shrink-0 ml-2">P.{citation.page} of 28</span>
            </div>

            <h3 className="font-sans font-bold text-base text-[#1C1D1B]">
              {citation.page === 4
                ? '3.2 Commercial Performance & Enterprise License Growth'
                : '5.1 Operating Expenditure Breakdown & Cloud R&D Allocations'}
            </h3>

            <p className="text-xs leading-relaxed text-[#4A4C46]">
              {citation.page === 4
                ? 'During the third quarter ended September 30, aggregate software license billings reached record velocity in both North American and European tier-1 accounts.'
                : 'Management maintained strict capital allocation discipline across core infrastructure expenditures, renegotiating multi-cloud compute volume agreements while sustaining engineering throughput.'}
            </p>

            {/* The Highlighted Citation Paragraph */}
            <div className="relative p-3.5 rounded-md bg-[#FFF5EB] border-l-3 border-[#8A4A00] my-2 text-xs">
              <div className="flex items-center gap-1 font-mono text-[10px] text-[#8A4A00] font-bold mb-1">
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Anchored Citation [{citation.id}] ({citation.matchScore}% Confidence)</span>
              </div>
              <p className="font-mono font-medium text-[#1C1D1B] leading-relaxed">
                “{citation.snippet}”
              </p>
            </div>

            <p className="text-xs leading-relaxed text-[#4A4C46]">
              {citation.page === 4
                ? 'Net recurring retention rate closed at 119%, supported by expansions in automated auditing and semantic document retrieval pipelines.'
                : 'Personnel additions in technical research were accompanied by steady gross margin expansion of 140 basis points compared to the prior fiscal year.'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#FAF8F5] border-t border-[#E2E0D8] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#656860] font-mono text-[11px]">
            <span>Match confidence: {citation.matchScore}%</span>
            <span>•</span>
            <span>{citation.matchTag}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-[#E2E0D8] bg-white text-[#1C1D1B] font-medium hover:bg-neutral-50"
            >
              Close View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
