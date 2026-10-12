import React, { useEffect, useMemo, useState } from 'react';
import { X, FileText, BookmarkCheck, ArrowLeft, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { SourceCitation } from '../types';
import { api, ApiError, ApiSegment } from '../api';

interface DocumentPageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: SourceCitation | null;
}

/** Regex that finds the snippet in the original text even if whitespace differs. */
function snippetPattern(snippet: string): RegExp | null {
  const words = snippet.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('\\s+'));
}

/** Pick the segment the citation came from: same page/section, and containing the snippet if possible. */
function findSegmentIndex(segments: ApiSegment[], citation: SourceCitation): number {
  const pattern = snippetPattern(citation.snippet);
  const byText = pattern ? segments.findIndex((s) => pattern.test(s.text)) : -1;
  const sameLocation = segments.findIndex(
    (s) => (citation.page == null || s.page === citation.page) && (citation.section == null || s.section === citation.section),
  );
  if (byText !== -1) return byText;
  if (sameLocation !== -1) return sameLocation;
  return 0;
}

export const DocumentPageViewerModal: React.FC<DocumentPageViewerModalProps> = ({ isOpen, onClose, citation }) => {
  const [segments, setSegments] = useState<ApiSegment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isOpen || !citation) return;
    let cancelled = false;
    setSegments(null);
    setError(null);

    api
      .getSegments(citation.docId)
      .then((segs) => {
        if (cancelled) return;
        setSegments(segs);
        setIndex(findSegmentIndex(segs, citation));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setError('This document has been deleted, so the cited passage can no longer be shown.');
        } else {
          setError(e instanceof Error ? e.message : 'Could not load the document.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, citation]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const segment = segments?.[index];

  // Split the segment text around the cited snippet so it can be highlighted
  const parts = useMemo(() => {
    if (!segment || !citation) return null;
    const pattern = snippetPattern(citation.snippet);
    const match = pattern ? pattern.exec(segment.text) : null;
    if (!match) return { before: segment.text, hit: '', after: '' };
    // The snippet is the first 200 chars of the chunk, so highlight to the end of that chunk's sentence
    const start = match.index;
    let end = start + match[0].length;
    const sentenceEnd = segment.text.slice(end).search(/[.!?](\s|$)/);
    if (sentenceEnd !== -1 && sentenceEnd < 400) end += sentenceEnd + 1;
    return { before: segment.text.slice(0, start), hit: segment.text.slice(start, end), after: segment.text.slice(end) };
  }, [segment, citation]);

  if (!isOpen || !citation) return null;

  const isPdf = citation.docName.toLowerCase().endsWith('.pdf');
  const unit = isPdf ? 'Page' : 'Section';
  const position = segment
    ? isPdf && segment.page != null
      ? `P.${segment.page} of ${segments!.length}`
      : `${unit} ${index + 1} of ${segments!.length}`
    : '';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#FFFFFF] rounded-2xl border border-[#E2E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="p-3 sm:p-3.5 bg-[#FAF8F5] border-b border-[#E2E0D8] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-[#FAF0E6] border border-[#F0D5BE] flex items-center justify-center text-[#C25E00] shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-bold text-[#1C1D1B] flex items-center gap-1.5 min-w-0">
              <span className="truncate">{citation.docName}</span>
              {segment?.page != null && (
                <span className="font-mono text-[10px] text-[#656860] px-1.5 py-0.2 rounded bg-white border border-[#E2E0D8] shrink-0">
                  P.{segment.page}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-[9.5px] sm:text-[10px] font-semibold text-[#8A4A00] bg-[#FAF3EA] border border-[#8A4A00] px-1.5 sm:px-2 py-0.5 rounded">
              Citation [{citation.id}]
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#656860] hover:text-[#1C1D1B] hover:bg-[#EFECE6] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Page Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#F8F6F0] text-xs sm:text-sm leading-relaxed text-[#1C1D1B]">
          {error ? (
            <div className="max-w-xl mx-auto p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#9D0208] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : !segments ? (
            <div className="flex items-center justify-center gap-2 py-16 text-xs font-mono text-[#656860]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading document...
            </div>
          ) : !segment ? (
            <p className="text-center py-16 text-xs text-[#656860]">This document has no text.</p>
          ) : (
            <div className="max-w-xl mx-auto bg-[#FFFFFF] p-4 sm:p-8 shadow-xs border border-[#E2E0D8] rounded-lg space-y-4">
              <div className="flex justify-between items-center text-[11px] sm:text-xs font-sans text-[#656860] border-b border-neutral-100 pb-2 gap-2">
                <span className="font-mono uppercase tracking-wider truncate">{segment.section ?? citation.docName}</span>
                <span className="font-mono shrink-0">{position}</span>
              </div>

              <div className="font-serif text-xs sm:text-[13px] leading-relaxed text-[#4A4C46] whitespace-pre-wrap break-words">
                {parts?.before}
                {parts?.hit && (
                  <span className="block relative p-3.5 rounded-md bg-[#FFF5EB] border-l-3 border-[#8A4A00] my-2 font-mono text-xs text-[#1C1D1B] not-italic">
                    <span className="flex items-center gap-1 font-mono text-[10px] text-[#8A4A00] font-bold mb-1">
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      Cited passage [{citation.id}] ({citation.matchScore}% match)
                    </span>
                    {parts.hit}
                  </span>
                )}
                {parts?.after}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#FAF8F5] border-t border-[#E2E0D8] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={!segments || index === 0}
              className="p-1.5 rounded-lg border border-[#E2E0D8] bg-white text-[#1C1D1B] hover:bg-neutral-50 disabled:opacity-40"
              title={`Previous ${unit.toLowerCase()}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIndex((i) => Math.min((segments?.length ?? 1) - 1, i + 1))}
              disabled={!segments || index >= segments.length - 1}
              className="p-1.5 rounded-lg border border-[#E2E0D8] bg-white text-[#1C1D1B] hover:bg-neutral-50 disabled:opacity-40"
              title={`Next ${unit.toLowerCase()}`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="hidden sm:inline ml-2 text-[#656860] font-mono text-[11px]">
              {citation.matchScore}% • {citation.matchTag}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-[#E2E0D8] bg-white text-[#1C1D1B] font-medium hover:bg-neutral-50"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};
