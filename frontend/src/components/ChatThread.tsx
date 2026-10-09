import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Quote,
  Share2,
  ShieldCheck,
  Check,
  ArrowRight,
  ListFilter,
  CheckCircle2
} from 'lucide-react';
import { SourceCitation } from '../types';

interface ChatThreadProps {
  onJumpToPage: (citation: SourceCitation) => void;
  onCopyResponse: () => void;
  onExportBibTeX: () => void;
  onShare: () => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  onJumpToPage,
  onCopyResponse,
  onExportBibTeX,
  onShare,
}) => {
  const [highlightedCitationId, setHighlightedCitationId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const citations: SourceCitation[] = [
    {
      id: 1,
      docName: 'Q3_Financial_Report.pdf',
      page: 4,
      section: 'Section 3.2',
      snippet: '...revenue grew by 18% quarter-over-quarter, led largely by enterprise retention and multi-year licensing deals...',
      matchScore: 98,
      matchTag: 'High Match',
    },
    {
      id: 2,
      docName: 'Q3_Financial_Report.pdf',
      page: 12,
      section: 'Section 5.1',
      snippet: '...operating expenses held steady at $1.2M throughout the period, with optimized cloud expenditures offsetting R&D personnel hires...',
      matchScore: 86,
      matchTag: 'Medium Match',
    },
  ];

  const handleCopy = () => {
    onCopyResponse();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToCitation = (id: number) => {
    setHighlightedCitationId(id);
    const element = document.getElementById(`source-card-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setTimeout(() => {
      setHighlightedCitationId(null);
    }, 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
      {/* 1. User Message Row */}
      <div className="flex flex-col items-end space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-mono text-[#656860] pr-1">
          <span>10:42 AM</span>
          <span className="font-semibold text-[#1C1D1B]">Researcher</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="bg-[#8A3E00] text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl rounded-tr-xs shadow-2xs max-w-[85%] sm:max-w-lg text-xs sm:text-sm font-medium">
            What was the total revenue growth in Q3?
          </div>

          {/* User Avatar RS */}
          <div className="w-8 h-8 rounded-full bg-[#E76F51] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            RS
          </div>
        </div>
      </div>

      {/* 2. Assistant Response Section */}
      <div className="space-y-3.5">
        {/* Assistant Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#8A3E00] text-white flex items-center justify-center shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-[#1C1D1B]">
              AskMyDocs Academic
            </span>
            <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-[#F8F6F0] text-[#656860] border border-[#E2E0D8]">
              Verifiable Synthesis
            </span>
          </div>

          <span className="font-mono text-xs text-[#656860]">
            10:42 AM
          </span>
        </div>

        {/* Assistant Message Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-xl p-5 shadow-xs space-y-4">
          {/* Synthesized Text with Interactive Citation Chips */}
          <p className="text-sm text-[#1C1D1B] leading-relaxed">
            Total revenue grew by <span className="font-bold text-[#C25E00]">18%</span> quarter-over-quarter, driven primarily by enterprise subscriptions{' '}
            <button
              onClick={() => scrollToCitation(1)}
              className="inline-flex items-center justify-center font-mono font-bold text-xs text-[#8A4A00] bg-[#FAF3EA] border border-[#8A4A00] px-1.5 py-0.2 rounded hover:bg-[#8A4A00] hover:text-white transition-colors cursor-pointer mx-0.5 shadow-2xs"
              title="Click to view Source Citation [1] Page 4"
            >
              [1]
            </button>
            . Operating expenses remained stable across all divisions{' '}
            <button
              onClick={() => scrollToCitation(2)}
              className="inline-flex items-center justify-center font-mono font-bold text-xs text-[#8A4A00] bg-[#FAF3EA] border border-[#8A4A00] px-1.5 py-0.2 rounded hover:bg-[#8A4A00] hover:text-white transition-colors cursor-pointer mx-0.5 shadow-2xs"
              title="Click to view Source Citation [2] Page 12"
            >
              [2]
            </button>
            .
          </p>

          {/* Action Strip beneath assistant message */}
          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#E2E0D8]/70 text-xs text-[#656860]">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 hover:text-[#1C1D1B] transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy response'}</span>
              </button>

              <button
                onClick={onExportBibTeX}
                className="inline-flex items-center gap-1.5 hover:text-[#1C1D1B] transition-colors cursor-pointer"
              >
                <Quote className="w-3.5 h-3.5" />
                <span>Export BibTeX</span>
              </button>

              <button
                onClick={onShare}
                className="inline-flex items-center gap-1.5 hover:text-[#1C1D1B] transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>

            {/* Grounding Score */}
            <div className="flex items-center gap-1.5 font-mono text-xs text-[#1C1D1B]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grounding Score: <strong className="font-bold">98%</strong></span>
            </div>
          </div>
        </div>

        {/* 3. Source Cards Block */}
        <div className="space-y-2.5 pt-2">
          {/* Header */}
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1C1D1B] uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-[#C25E00]" />
            <span>2 VERIFIED SOURCE CITATIONS</span>
          </div>

          {/* Grid of 2 Source Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {citations.map((citation) => {
              const isTargeted = highlightedCitationId === citation.id;
              return (
                <div
                  key={citation.id}
                  id={`source-card-${citation.id}`}
                  className={`bg-[#FFFFFF] rounded-lg border p-4 transition-all border-l-4 ${
                    isTargeted
                      ? 'border-[#8A4A00] border-l-[#8A4A00] ring-2 ring-[#8A4A00]/25 shadow-md'
                      : 'border-[#E2E0D8] border-l-[#C25E00] hover:border-[#C25E00]/60 shadow-2xs'
                  }`}
                >
                  {/* Card Header Badge & Match Tag */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#1C1D1B]">
                      <span className="text-[#8A4A00]">[{citation.id}]</span>
                      <span className="truncate max-w-[150px]" title={citation.docName}>
                        {citation.docName}
                      </span>
                      <span className="text-[#656860]">• P.{citation.page}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        citation.matchTag === 'High Match'
                          ? 'bg-[#E5EFE8] text-[#1E5631] border border-[#C6DEC9]'
                          : 'bg-[#FFF3E0] text-[#B25E00] border border-[#FFE0B2]'
                      }`}
                    >
                      {citation.matchScore}% {citation.matchTag}
                    </span>
                  </div>

                  {/* Quote Snippet in Monospace Font */}
                  <div className="p-3 bg-[#F8F6F0] rounded-md border border-[#E2E0D8] font-mono text-xs text-[#1C1D1B] leading-relaxed mb-3">
                    “{citation.snippet}”
                  </div>

                  {/* Card Footer: Section and Jump to Page */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="font-mono text-[11px] text-[#656860]">
                      {citation.section}
                    </span>

                    <button
                      onClick={() => onJumpToPage(citation)}
                      className="inline-flex items-center gap-1 font-semibold text-xs text-[#C25E00] hover:text-[#8A4A00] hover:underline cursor-pointer"
                    >
                      <span>Jump to page</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
