import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  AlertTriangle,
  FileText,
  Search,
  Sparkles,
  ShieldCheck,
  Info,
  Paperclip,
  Mic,
  ArrowUp,
  X,
  Plus,
  RefreshCw,
  ExternalLink,
  Target
} from 'lucide-react';

interface ChatStateVariantsProps {
  onRetryRequest?: () => void;
  onUploadWarrantyDoc?: () => void;
  onRephraseQuery?: () => void;
}

export const ChatStateVariants: React.FC<ChatStateVariantsProps> = ({
  onRetryRequest,
  onUploadWarrantyDoc,
  onRephraseQuery,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'loading' | 'not-found' | 'error' | 'composer'>('all');
  const [composerText, setComposerText] = useState('Compare Q3 operating expenses with');
  const [retryingError, setRetryingError] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [searchFilterText, setSearchFilterText] = useState('');

  // Blinking cursor simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(timer);
  }, []);

  const handleRetry = () => {
    setRetryingError(true);
    if (onRetryRequest) onRetryRequest();
    setTimeout(() => {
      setRetryingError(false);
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-6 sm:space-y-8 max-w-4xl mx-auto w-full select-none">
      {/* 0. Top Diagnostic Context Header & Scope Bar */}
      <div className="space-y-3 pb-2 border-b border-[#E2E0D8]">
        {/* Scope and Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-mono text-[10.5px] text-[#656860] uppercase">SCOPE:</span>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-[#FAF0E6] text-[#C25E00] border border-[#F0D5BE] font-mono text-[10.5px] sm:text-[11px] font-bold">
              <span className="truncate max-w-[140px] sm:max-w-none">Q3_Financial_Report.pdf</span>
              <button className="hover:text-black cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </div>
            <button className="hidden sm:inline-block px-2 py-1 rounded-md bg-white border border-[#E2E0D8] text-[11px] font-mono text-[#656860] hover:text-[#1C1D1B]">
              + Query Entire Corpus
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E5EFE8] text-[#1E5631] font-mono text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Local Engine
            </span>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-3 h-3 text-[#656860] absolute left-2 top-2" />
              <input
                type="text"
                value={searchFilterText}
                onChange={(e) => setSearchFilterText(e.target.value)}
                placeholder="Filter turns..."
                className="pl-7 pr-2 py-0.5 sm:py-1 text-[11px] bg-white border border-[#E2E0D8] rounded-md placeholder:text-[#656860] focus:outline-hidden w-28 sm:w-36"
              />
            </div>
          </div>
        </div>

        {/* Diagnostic Interface Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#FAF0E6] text-[#C25E00] font-bold text-[10px] rounded">
              DIAGNOSTIC INTERFACE
            </span>
            <span className="font-bold text-sm font-sans text-[#1C1D1B]">
              Synthesis State Variants
            </span>
          </div>
          <span className="text-[11px] text-[#656860] hidden sm:inline">
            Showing 4 core research states under strict peer-review mode
          </span>
        </div>

        {/* State Switcher Tabs with horizontal scroll on mobile */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors shrink-0 ${
              activeFilter === 'all'
                ? 'bg-[#1C1D1B] text-white'
                : 'bg-white border border-[#E2E0D8] text-[#656860] hover:text-[#1C1D1B]'
            }`}
          >
            All 4 States
          </button>
          <button
            onClick={() => setActiveFilter('loading')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors shrink-0 ${
              activeFilter === 'loading'
                ? 'bg-[#B57614] text-white'
                : 'bg-white border border-[#E2E0D8] text-[#656860] hover:text-[#1C1D1B]'
            }`}
          >
            State A: Loading
          </button>
          <button
            onClick={() => setActiveFilter('not-found')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors shrink-0 ${
              activeFilter === 'not-found'
                ? 'bg-[#1E5631] text-white'
                : 'bg-white border border-[#E2E0D8] text-[#656860] hover:text-[#1C1D1B]'
            }`}
          >
            State B: Not Found
          </button>
          <button
            onClick={() => setActiveFilter('error')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors shrink-0 ${
              activeFilter === 'error'
                ? 'bg-[#9D0208] text-white'
                : 'bg-white border border-[#E2E0D8] text-[#656860] hover:text-[#1C1D1B]'
            }`}
          >
            State C: Error
          </button>
          <button
            onClick={() => setActiveFilter('composer')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors shrink-0 ${
              activeFilter === 'composer'
                ? 'bg-[#C25E00] text-white'
                : 'bg-white border border-[#E2E0D8] text-[#656860] hover:text-[#1C1D1B]'
            }`}
          >
            State D: Active Composer
          </button>
        </div>
      </div>

      {/* ========================================================
          STATE A: LOADING STATE (Searching your documents...)
          ======================================================== */}
      {(activeFilter === 'all' || activeFilter === 'loading') && (
        <section className="space-y-3 p-5 bg-[#FFFFFF] rounded-xl border border-[#E2E0D8] shadow-2xs">
          {/* State Tag & Meta */}
          <div className="flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#FAF0E6] text-[#C25E00] font-bold text-[10px]">
                STATE 01
              </span>
              <span className="font-bold text-[#1C1D1B]">
                Active Retrieval & Embeddings Query
              </span>
            </div>
            <span className="text-[11px] text-[#656860]">
              Live Turn: #104
            </span>
          </div>

          {/* User Bubble */}
          <div className="flex flex-col items-end space-y-1">
            <span className="text-[11px] font-mono text-[#656860]">10:48 AM • Lead Researcher</span>
            <div className="flex items-center gap-2">
              <div className="bg-[#8A3E00] text-white px-4 py-2.5 rounded-xl rounded-tr-xs text-xs sm:text-sm font-medium">
                Summarize Section 2
              </div>
              <div className="w-7 h-7 rounded-full bg-[#E76F51] text-white font-bold text-xs flex items-center justify-center shrink-0">
                LR
              </div>
            </div>
          </div>

          {/* Assistant Loading Response */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FAF0E6] border border-[#F0D5BE] flex items-center justify-center text-[#C25E00] shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#C25E00]">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C25E00] animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C25E00] animate-bounce [animation-delay:0.2s]"></span>
                    </span>
                    Searching your documents...
                  </span>
                </div>
              </div>
              <span className="font-mono text-[11px] text-[#656860]">k=8 vector recall</span>
            </div>

            {/* Scanning details bar */}
            <div className="p-2.5 bg-[#FAF8F5] rounded-md border border-[#E2E0D8] flex items-center gap-2 text-xs font-mono text-[#656860]">
              <RefreshCw className="w-3 h-3 text-[#C25E00] animate-spin" />
              <span>
                Scanning 1,420 chunks in <strong className="text-[#1C1D1B]">Q3_Financial_Report.pdf</strong> • 87% semantic align
              </span>
            </div>

            {/* Skeleton loader text blocks */}
            <div className="space-y-2.5 p-3.5 bg-[#F8F6F0]/60 rounded-lg border border-[#E2E0D8]/60">
              <div className="w-full h-3 rounded-full bg-[#E5E2D8] animate-pulse"></div>
              <div className="w-11/12 h-3 rounded-full bg-[#E5E2D8] animate-pulse"></div>
              <div className="w-4/5 h-3 rounded-full bg-[#E5E2D8] animate-pulse"></div>
            </div>

            <p className="text-[11px] font-mono text-[#656860] italic">
              Extracting tables, non-GAAP reconciliations, and footnotes before token synthesis...
            </p>
          </div>
        </section>
      )}

      {/* ========================================================
          STATE B: NOT FOUND (Grounded Null Result)
          ======================================================== */}
      {(activeFilter === 'all' || activeFilter === 'not-found') && (
        <section className="space-y-3 p-5 bg-[#FFFFFF] rounded-xl border border-[#E2E0D8] shadow-2xs">
          {/* State Tag & Meta */}
          <div className="flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#E5EFE8] text-[#1E5631] font-bold text-[10px]">
                STATE 02
              </span>
              <span className="font-bold text-[#1C1D1B]">
                Grounded Null Result (Hallucination Prevention)
              </span>
            </div>
            <span className="text-[11px] text-[#656860]">
              Zero Hallucinations Guarantee
            </span>
          </div>

          {/* User Bubble */}
          <div className="flex flex-col items-end space-y-1">
            <span className="text-[11px] font-mono text-[#656860]">10:51 AM • Lead Researcher</span>
            <div className="flex items-center gap-2">
              <div className="bg-[#8A3E00] text-white px-4 py-2.5 rounded-xl rounded-tr-xs text-xs sm:text-sm font-medium">
                What is the warranty policy?
              </div>
              <div className="w-7 h-7 rounded-full bg-[#E76F51] text-white font-bold text-xs flex items-center justify-center shrink-0">
                LR
              </div>
            </div>
          </div>

          {/* Assistant Not Found Response Card in Calm Neutral Gray */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FAF0E6] text-[#C25E00] flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-[#1C1D1B]">
                AskMyDocs Academic
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#F8F6F0] text-[#656860] border border-[#E2E0D8]">
                Verifiable Synthesis Protocol
              </span>
            </div>

            {/* Calm Neutral Message */}
            <div className="p-4 bg-[#F8F6F0] rounded-xl border border-[#E2E0D8] space-y-3">
              <p className="text-sm font-medium text-[#1C1D1B] leading-relaxed">
                The uploaded documents do not contain information about a warranty policy.
              </p>

              {/* Provenance Audit Record box */}
              <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#E2E0D8] space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#1C1D1B]">
                  <Info className="w-3.5 h-3.5 text-[#656860]" />
                  <span>Provenance Audit Record</span>
                </div>
                <p className="text-[11.5px] text-[#656860] leading-relaxed">
                  Direct semantic anchoring searched across 1,816 chunks in the active corpus and found 0 matching citations with sufficient confidence score (&gt;80%). The system adheres strictly to the corpus to avoid fabrications. Try uploading additional relevant policy documents or rephrasing your search query.
                </p>
              </div>

              {/* Recommended Steps */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-mono text-[#656860]">Recommended steps:</span>
                <button
                  onClick={onUploadWarrantyDoc}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#E2E0D8] hover:border-[#C25E00] hover:text-[#C25E00] text-xs font-medium text-[#1C1D1B] transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#C25E00]" />
                  <span>Upload Warranty Policy PDF</span>
                </button>
                <button
                  onClick={onRephraseQuery}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#E2E0D8] hover:border-[#C25E00] hover:text-[#C25E00] text-xs font-medium text-[#1C1D1B] transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-[#656860]" />
                  <span>Rephrase query for terms &amp; guarantees</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          STATE C: ERROR STATE (Something went wrong... Retry)
          ======================================================== */}
      {(activeFilter === 'all' || activeFilter === 'error') && (
        <section className="space-y-3 p-5 bg-[#FFFFFF] rounded-xl border border-[#E2E0D8] shadow-2xs">
          {/* State Tag & Meta */}
          <div className="flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#FEE2E2] text-[#9D0208] font-bold text-[10px]">
                STATE 03
              </span>
              <span className="font-bold text-[#1C1D1B]">
                System Retrieval Failure / Error State
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#9D0208]">
              HTTP 504 Pipeline Exception
            </span>
          </div>

          {/* User Bubble */}
          <div className="flex flex-col items-end space-y-1">
            <span className="text-[11px] font-mono text-[#656860]">10:54 AM • Lead Researcher</span>
            <div className="flex items-center gap-2">
              <div className="bg-[#8A3E00] text-white px-4 py-2.5 rounded-xl rounded-tr-xs text-xs sm:text-sm font-medium">
                Analyze report
              </div>
              <div className="w-7 h-7 rounded-full bg-[#E76F51] text-white font-bold text-xs flex items-center justify-center shrink-0">
                LR
              </div>
            </div>
          </div>

          {/* Assistant Error Card with Subtle Red Border */}
          <div className="p-4 bg-[#FFFBFB] rounded-xl border border-[#FCA5A5] space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#FEE2E2] text-[#9D0208] flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#9D0208]">
                  Something went wrong while processing your request.
                </h4>
                <p className="text-xs text-[#656860] leading-relaxed">
                  The indexing orchestrator was unable to establish socket connectivity with the downstream vector embedding pipeline.
                </p>
              </div>
            </div>

            {/* Error Code Telemetry Block */}
            <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#FCA5A5]/60 font-mono text-[11px] space-y-1 text-[#656860]">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-[#9D0208] font-bold">
                  Error Code: RETRIEVAL_GATEWAY_TIMEOUT (504)
                </span>
                <span>Cluster: us-east-inference-09</span>
              </div>
              <p className="text-[10.5px]">
                Pipeline interrupted during embedding vector synthesis. Correlation ID: <code className="text-[#1C1D1B]">req_9df8a3c0842</code>
              </p>
            </div>

            {/* Action Row with Outline Retry Button */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleRetry}
                disabled={retryingError}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#9D0208] text-[#9D0208] bg-white hover:bg-[#FEE2E2] font-mono text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <RotateCw className={`w-3.5 h-3.5 ${retryingError ? 'animate-spin' : ''}`} />
                <span>{retryingError ? 'Retrying Pipeline...' : 'Retry'}</span>
              </button>

              <button
                onClick={() => alert('Diagnostic log package generated for infrastructure support.')}
                className="inline-flex items-center gap-1 text-xs text-[#656860] hover:text-[#1C1D1B] hover:underline"
              >
                <span>Report issue to infrastructure team</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          STATE D: ACTIVE INPUT BAR (Focused State with Cursor)
          ======================================================== */}
      {(activeFilter === 'all' || activeFilter === 'composer') && (
        <section className="space-y-3 p-5 bg-[#FFFFFF] rounded-xl border border-[#E2E0D8] shadow-2xs">
          {/* State Tag & Meta */}
          <div className="flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#FAF0E6] text-[#C25E00] font-bold text-[10px]">
                STATE 04
              </span>
              <span className="font-bold text-[#1C1D1B]">
                Active Input Bar &amp; Multi-modal Composer Focus
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#C25E00] font-bold">
              FOCUSED / TYPING ACTIVE
            </span>
          </div>

          <p className="text-xs text-[#656860]">
            Elevated composer view featuring real-time token budgeting, active citation locks, and contextual scope tags.
          </p>

          {/* Focused Composer Box with Blinking Active Cursor */}
          <div className="p-3.5 bg-[#FFFFFF] rounded-2xl border-2 border-[#C25E00] shadow-sm ring-3 ring-[#C25E00]/10 space-y-3 transition-all">
            {/* Input field with blinking cursor */}
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#C25E00] shrink-0" />
              <div className="flex-1 text-sm font-medium text-[#1C1D1B] font-sans flex items-center">
                <span>{composerText}</span>
                <span
                  className={`inline-block w-0.5 h-4 bg-[#C25E00] ml-0.5 ${
                    cursorVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                ></span>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#E2E0D8]/60">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F8F6F0] border border-[#E2E0D8] text-xs font-medium text-[#1C1D1B] hover:bg-[#EFECE6]"
                >
                  <Paperclip className="w-3.5 h-3.5 text-[#656860]" />
                  <span>Attach</span>
                </button>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF3E0] border border-[#FFE0B2] text-[11px] font-semibold text-[#B25E00]">
                  Strict Citing [Enabled]
                </span>

                <button
                  type="button"
                  className="p-1 rounded text-[#656860] hover:text-[#1C1D1B]"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                <span className="font-mono text-[10.5px] sm:text-[11px] text-[#656860]">
                  <strong className="text-[#1C1D1B]">42</strong> / 2,000 tokens
                </span>

                {/* Active Synthesize Button */}
                <button
                  type="button"
                  onClick={() => alert(`Synthesizing query: "${composerText}" against Q3_Financial_Report.pdf`)}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-[#8A3E00] hover:bg-[#723200] active:scale-95 text-white font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span>Synthesize</span>
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Monospace Keyboard Hints */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#656860] pt-1">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-[#E2E0D8] rounded text-[#1C1D1B]">↵ Enter</kbd> to synthesize
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-[#E2E0D8] rounded text-[#1C1D1B]">Esc</kbd> to clear focus
              </span>
            </div>
            <span>Model: Academic-GPT-4o (Strict Grounding Mode)</span>
          </div>
        </section>
      )}
    </div>
  );
};
