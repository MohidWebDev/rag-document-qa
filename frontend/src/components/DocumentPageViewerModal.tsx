import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, FileText, BookmarkCheck, Loader2, AlertTriangle } from 'lucide-react';
import { SourceCitation, ViewerTarget, plural } from '../types';
import { api, ApiError, ApiSegment } from '../api';

interface DocumentPageViewerModalProps {
  target: ViewerTarget | null;
  onClose: () => void;
}

const escapeRegex = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Find the cited snippet in a segment's text, ignoring whitespace differences.
 * A chunk can start in one segment and continue into the next (short Markdown sections are
 * merged before chunking), so if the whole snippet isn't found, fall back to the longest
 * tail of it (at least 5 words) that is.
 */
function findSnippet(text: string, snippet: string): { index: number; length: number } | null {
  const words = snippet.trim().split(/\s+/).filter(Boolean).map(escapeRegex);
  const minWords = Math.min(5, words.length);
  for (let start = 0; words.length - start >= minWords && words.length > 0; start++) {
    const match = new RegExp(words.slice(start).join('\\s+')).exec(text);
    if (match) return { index: match.index, length: match[0].length };
  }
  return null;
}

/** The segment the citation came from: the one containing the snippet, else the same page/section. */
function findSegmentIndex(segments: ApiSegment[], citation: SourceCitation): number {
  const byText = segments.findIndex((s) => findSnippet(s.text, citation.snippet) !== null);
  if (byText !== -1) return byText;
  return segments.findIndex(
    (s) => (citation.page == null || s.page === citation.page) && (citation.section == null || s.section === citation.section),
  );
}

/** Split a segment's text around the cited snippet so it can be highlighted. */
function splitAroundSnippet(text: string, snippet: string) {
  const found = findSnippet(text, snippet);
  if (!found) return null;
  // The snippet is the first 200 chars of the chunk, so extend the highlight to the end of that sentence
  const start = found.index;
  let end = start + found.length;
  const sentenceEnd = text.slice(end).search(/[.!?](\s|$)/);
  if (sentenceEnd !== -1 && sentenceEnd < 400) end += sentenceEnd + 1;
  return { before: text.slice(0, start), hit: text.slice(start, end), after: text.slice(end) };
}

function segmentHeading(seg: ApiSegment, isPdf: boolean, index: number): string {
  if (isPdf && seg.page != null) return `Page ${seg.page}`;
  return seg.section ?? `Section ${index + 1}`;
}

/** Reads a whole document. Opened from a citation, it scrolls to the cited passage and highlights it. */
export const DocumentPageViewerModal: React.FC<DocumentPageViewerModalProps> = ({ target, onClose }) => {
  const [segments, setSegments] = useState<ApiSegment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const highlightRef = useRef<HTMLElement | null>(null);
  const setHighlight = (el: HTMLElement | null) => {
    highlightRef.current = el;
  };
  const citation = target?.citation;

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setSegments(null);
    setError(null);

    api
      .getSegments(target.docId)
      .then((segs) => !cancelled && setSegments(segs))
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setError('This document has been deleted, so it can no longer be shown.');
        } else {
          setError(e instanceof Error ? e.message : 'Could not load the document.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, onClose]);

  const citedIndex = useMemo(
    () => (segments && citation ? findSegmentIndex(segments, citation) : -1),
    [segments, citation],
  );

  // Bring the cited passage into view once the text is on screen
  useEffect(() => {
    if (citedIndex !== -1) highlightRef.current?.scrollIntoView({ block: 'center' });
  }, [citedIndex]);

  if (!target) return null;

  const isPdf = target.docName.toLowerCase().endsWith('.pdf');
  const cited = citedIndex !== -1 && segments ? segments[citedIndex] : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#FFFFFF] rounded-2xl border border-[#E2E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-3 sm:p-3.5 bg-[#FAF8F5] border-b border-[#E2E0D8] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-[#FAF0E6] border border-[#F0D5BE] flex items-center justify-center text-[#C25E00] shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-bold text-[#1C1D1B] break-all">{target.docName}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {citation && (
              <span className="font-mono text-[9.5px] sm:text-[10px] font-semibold text-[#8A4A00] bg-[#FAF3EA] border border-[#8A4A00] px-1.5 sm:px-2 py-0.5 rounded">
                {cited ? `${segmentHeading(cited, isPdf, citedIndex)} · ` : ''}Source [{citation.id}]
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#656860] hover:text-[#1C1D1B] hover:bg-[#EFECE6] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
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
          ) : segments.length === 0 ? (
            <p className="text-center py-16 text-xs text-[#656860]">This document has no text.</p>
          ) : (
            <div className="max-w-xl mx-auto space-y-3">
              {segments.map((seg, i) => {
                const parts = i === citedIndex && citation ? splitAroundSnippet(seg.text, citation.snippet) : null;
                return (
                  <section
                    key={seg.segment_index}
                    className="bg-[#FFFFFF] p-4 sm:p-6 shadow-xs border border-[#E2E0D8] rounded-lg space-y-3"
                  >
                    <div className="flex justify-between items-center text-[11px] font-mono text-[#656860] border-b border-neutral-100 pb-2 gap-2">
                      <span className="uppercase tracking-wider truncate">{segmentHeading(seg, isPdf, i)}</span>
                      <span className="shrink-0">
                        {i + 1} / {segments.length}
                      </span>
                    </div>
                    <div className="font-serif text-xs sm:text-[13px] leading-relaxed text-[#4A4C46] whitespace-pre-wrap break-words">
                      {parts ? (
                        <>
                          {parts.before}
                          <span
                            ref={setHighlight}
                            className="block p-3.5 rounded-md bg-[#FFF5EB] border-l-3 border-[#8A4A00] my-2 font-mono text-xs text-[#1C1D1B]"
                          >
                            <span className="flex items-center gap-1 text-[10px] text-[#8A4A00] font-bold mb-1">
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              Cited passage [{citation!.id}]
                            </span>
                            {parts.hit}
                          </span>
                          {parts.after}
                        </>
                      ) : (
                        <div ref={i === citedIndex ? setHighlight : undefined}>{seg.text}</div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FAF8F5] border-t border-[#E2E0D8] flex items-center justify-between gap-2 text-xs">
          <span className="text-[#656860] font-mono text-[11px]">
            {segments ? plural(segments.length, isPdf ? 'page' : 'section') : ''}
            {citation ? ` · ${citation.matchScore}% similar to your question` : ''}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-[#E2E0D8] bg-white text-[#1C1D1B] font-medium hover:bg-neutral-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
