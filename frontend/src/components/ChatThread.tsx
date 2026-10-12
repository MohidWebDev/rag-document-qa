import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Copy,
  Quote,
  Share2,
  ShieldCheck,
  Check,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Info,
  Search,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { ChatMessage, SourceCitation, locationLabel } from '../types';

interface ChatThreadProps {
  messages: ChatMessage[];
  onJumpToPage: (citation: SourceCitation) => void;
  onCopyResponse: (message: ChatMessage) => void;
  onExportBibTeX: (message: ChatMessage) => void;
  onShare: () => void;
  onRetry: (message: ChatMessage) => void;
  onUploadClick: () => void;
  onSearchAllDocuments: (message: ChatMessage) => void;
}

/** Render **bold** and [n] citation markers inside one line of answer text. */
function renderInline(
  text: string,
  citationIds: Set<number>,
  onCite: (id: number) => void,
  keyPrefix: string,
): React.ReactNode[] {
  const parts = text.split(/(\[\d+\]|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    const cite = part.match(/^\[(\d+)\]$/);
    if (cite) {
      const id = Number(cite[1]);
      if (!citationIds.has(id)) return <span key={key}>{part}</span>;
      return (
        <button
          key={key}
          onClick={() => onCite(id)}
          className="inline-flex items-center justify-center font-mono font-bold text-xs text-[#8A4A00] bg-[#FAF3EA] border border-[#8A4A00] px-1.5 py-0.2 rounded hover:bg-[#8A4A00] hover:text-white transition-colors cursor-pointer mx-0.5 shadow-2xs"
          title={`View source citation [${id}]`}
        >
          [{id}]
        </button>
      );
    }
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={key} className="font-bold text-[#C25E00]">
          {bold[1]}
        </strong>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

const UserBubble: React.FC<{ message: ChatMessage }> = ({ message }) => (
  <div className="flex flex-col items-end space-y-1.5">
    <div className="flex items-center gap-2 text-xs font-mono text-[#656860] pr-1">
      <span>{message.timestamp}</span>
      <span className="font-semibold text-[#1C1D1B]">{message.senderName}</span>
    </div>

    <div className="flex items-center gap-2 sm:gap-2.5">
      <div className="bg-[#8A3E00] text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl rounded-tr-xs shadow-2xs max-w-[85%] sm:max-w-lg text-xs sm:text-sm font-medium whitespace-pre-wrap break-words">
        {message.content}
      </div>
      <div className="w-8 h-8 rounded-full bg-[#E76F51] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
        {message.senderName.charAt(0).toUpperCase()}
      </div>
    </div>
  </div>
);

const AssistantHeader: React.FC<{ message: ChatMessage; badge: string }> = ({ message, badge }) => (
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-7 h-7 rounded-full bg-[#8A3E00] text-white flex items-center justify-center shadow-2xs shrink-0">
        <FileText className="w-4 h-4" />
      </div>
      <span className="font-bold text-sm text-[#1C1D1B] shrink-0">{message.senderName}</span>
      <span className="hidden sm:inline font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-[#F8F6F0] text-[#656860] border border-[#E2E0D8] truncate">
        {badge}
      </span>
    </div>
    <span className="font-mono text-xs text-[#656860] shrink-0">{message.timestamp}</span>
  </div>
);

const AssistantMessage: React.FC<{
  message: ChatMessage;
  props: ChatThreadProps;
}> = ({ message, props }) => {
  const [highlightedCitationId, setHighlightedCitationId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const citations = message.citations ?? [];
  const citationIds = new Set(citations.map((c) => c.id));

  const scrollToCitation = (id: number) => {
    setHighlightedCitationId(id);
    document
      .getElementById(`source-card-${message.id}-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => setHighlightedCitationId(null), 2500);
  };

  if (message.status === 'loading') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#FAF0E6] border border-[#F0D5BE] flex items-center justify-center text-[#C25E00] shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#C25E00]">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C25E00] animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C25E00] animate-bounce [animation-delay:0.2s]"></span>
              </span>
              Searching your documents...
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-[#FAF8F5] rounded-md border border-[#E2E0D8] flex items-center gap-2 text-xs font-mono text-[#656860]">
          <RefreshCw className="w-3 h-3 text-[#C25E00] animate-spin shrink-0" />
          <span className="truncate">
            Retrieving relevant passages from <strong className="text-[#1C1D1B]">{message.scopeLabel}</strong>
          </span>
        </div>

        <div className="space-y-2.5 p-3.5 bg-[#F8F6F0]/60 rounded-lg border border-[#E2E0D8]/60">
          <div className="w-full h-3 rounded-full bg-[#E5E2D8] animate-pulse"></div>
          <div className="w-11/12 h-3 rounded-full bg-[#E5E2D8] animate-pulse"></div>
          <div className="w-4/5 h-3 rounded-full bg-[#E5E2D8] animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (message.status === 'not-found') {
    return (
      <div className="space-y-3">
        <AssistantHeader message={message} badge="Grounded Null Result" />
        <div className="p-4 bg-[#F8F6F0] rounded-xl border border-[#E2E0D8] space-y-3">
          <p className="text-sm font-medium text-[#1C1D1B] leading-relaxed">{message.content}</p>

          <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#E2E0D8] space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#1C1D1B]">
              <Info className="w-3.5 h-3.5 text-[#656860]" />
              <span>Why no answer?</span>
            </div>
            <p className="text-[11.5px] text-[#656860] leading-relaxed">
              No passage in <strong className="text-[#1C1D1B]">{message.scopeLabel}</strong> was relevant enough
              to answer from. AskMyDocs only answers from your documents, so instead of guessing it says so. Try
              rephrasing with words the document is likely to use, or upload a document that covers this topic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-[#656860]">Next steps:</span>
            <button
              onClick={props.onUploadClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#E2E0D8] hover:border-[#C25E00] hover:text-[#C25E00] text-xs font-medium text-[#1C1D1B] transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#C25E00]" />
              <span>Upload a document</span>
            </button>
            {message.scopeDocId && (
              <button
                onClick={() => props.onSearchAllDocuments(message)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#E2E0D8] hover:border-[#C25E00] hover:text-[#C25E00] text-xs font-medium text-[#1C1D1B] transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#656860]" />
                <span>Ask across all documents</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (message.status === 'error') {
    return (
      <div className="p-4 bg-[#FFFBFB] rounded-xl border border-[#FCA5A5] space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#FEE2E2] text-[#9D0208] flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#9D0208]">Something went wrong while processing your request.</h4>
            <p className="text-xs text-[#656860] leading-relaxed">{message.content}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => {
              setRetrying(true);
              props.onRetry(message);
            }}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#9D0208] text-[#9D0208] bg-white hover:bg-[#FEE2E2] font-mono text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-60"
          >
            <RotateCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retrying ? 'Retrying...' : 'Retry'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Answered
  const topMatch = citations.length ? Math.max(...citations.map((c) => c.matchScore)) : null;
  const paragraphs = message.content.split(/\n{2,}/);

  return (
    <div className="space-y-3.5">
      <AssistantHeader message={message} badge={`Scope: ${message.scopeLabel}`} />

      <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-xl p-5 shadow-xs space-y-4">
        <div className="space-y-3">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-sm text-[#1C1D1B] leading-relaxed whitespace-pre-line break-words">
              {renderInline(para, citationIds, scrollToCitation, `${message.id}-${i}`)}
            </p>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E0D8]/70 text-xs text-[#656860]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                props.onCopyResponse(message);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 hover:text-[#1C1D1B] transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy response'}</span>
            </button>

            {citations.length > 0 && (
              <button
                onClick={() => props.onExportBibTeX(message)}
                className="inline-flex items-center gap-1.5 hover:text-[#1C1D1B] transition-colors cursor-pointer"
              >
                <Quote className="w-3.5 h-3.5" />
                <span>Export BibTeX</span>
              </button>
            )}

            <button
              onClick={props.onShare}
              className="inline-flex items-center gap-1.5 hover:text-[#1C1D1B] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>

          {topMatch !== null && (
            <div className="flex items-center gap-1.5 font-mono text-xs text-[#1C1D1B]" title="Similarity of the best-matching source">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Top match: <strong className="font-bold">{topMatch}%</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {citations.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1C1D1B] uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-[#C25E00]" />
            <span>
              {citations.length} SOURCE CITATION{citations.length === 1 ? '' : 'S'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {citations.map((citation) => {
              const isTargeted = highlightedCitationId === citation.id;
              const location = locationLabel(citation);
              return (
                <div
                  key={citation.id}
                  id={`source-card-${message.id}-${citation.id}`}
                  className={`bg-[#FFFFFF] rounded-lg border p-4 transition-all border-l-4 ${
                    isTargeted
                      ? 'border-[#8A4A00] border-l-[#8A4A00] ring-2 ring-[#8A4A00]/25 shadow-md'
                      : 'border-[#E2E0D8] border-l-[#C25E00] hover:border-[#C25E00]/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#1C1D1B] min-w-0">
                      <span className="text-[#8A4A00] shrink-0">[{citation.id}]</span>
                      <span className="truncate" title={citation.docName}>
                        {citation.docName}
                      </span>
                      {citation.page != null && <span className="text-[#656860] shrink-0">• P.{citation.page}</span>}
                    </div>

                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        citation.matchTag === 'High Match'
                          ? 'bg-[#E5EFE8] text-[#1E5631] border border-[#C6DEC9]'
                          : 'bg-[#FFF3E0] text-[#B25E00] border border-[#FFE0B2]'
                      }`}
                    >
                      {citation.matchScore}% {citation.matchTag}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8F6F0] rounded-md border border-[#E2E0D8] font-mono text-xs text-[#1C1D1B] leading-relaxed mb-3 break-words">
                    “{citation.snippet}{citation.snippet.length >= 200 ? "…" : ""}”
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <span className="font-mono text-[11px] text-[#656860] truncate">{citation.section ?? location}</span>
                    <button
                      onClick={() => props.onJumpToPage(citation)}
                      className="inline-flex items-center gap-1 font-semibold text-xs text-[#C25E00] hover:text-[#8A4A00] hover:underline cursor-pointer shrink-0"
                    >
                      <span>{citation.page != null ? 'Jump to page' : 'View in document'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const ChatThread: React.FC<ChatThreadProps> = (props) => {
  const endRef = useRef<HTMLDivElement>(null);
  const lastMessage = props.messages[props.messages.length - 1];

  // Keep the newest turn in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [props.messages.length, lastMessage?.status]);

  return (
    <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
      {props.messages.map((message) =>
        message.sender === 'user' ? (
          <UserBubble key={message.id} message={message} />
        ) : (
          <AssistantMessage key={message.id} message={message} props={props} />
        ),
      )}
      <div ref={endRef} />
    </div>
  );
};
