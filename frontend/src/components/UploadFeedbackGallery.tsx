import React, { useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  RefreshCw,
  ExternalLink,
  X,
  FileText
} from 'lucide-react';

interface UploadFeedbackGalleryProps {
  onDismissItem?: (id: string) => void;
  onViewExisting?: (docName: string) => void;
}

export const UploadFeedbackGallery: React.FC<UploadFeedbackGalleryProps> = ({
  onDismissItem,
  onViewExisting,
}) => {
  const [progressPercent, setProgressPercent] = useState(60);

  return (
    <div className="w-full max-w-sm sm:w-[350px] bg-[#FFFFFF] rounded-2xl border border-[#E2E0D8] p-4 shadow-xl space-y-3.5 select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Card Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#FAF0E6] text-[#C25E00] flex items-center justify-center">
              <UploadCloud className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-[#1C1D1B]">
              Upload Feedback
            </h3>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E2E0D8] text-[#656860] font-semibold">
            Live Pipeline
          </span>
        </div>
        <p className="text-[11px] text-[#656860] leading-snug">
          Corpus ingestion statuses and error feedback handlers for document uploads.
        </p>
      </div>

      {/* Stacked Feedback Items */}
      <div className="space-y-2.5">
        {/* 1. IN-PROGRESS FILE ROW */}
        <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E2E0D8] space-y-2">
          {/* File and % Header */}
          <div className="flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1C1D1B] truncate max-w-[200px]">
              <RefreshCw className="w-3.5 h-3.5 text-[#C25E00] animate-spin shrink-0" />
              <span className="truncate">annual_audit.pdf</span>
            </div>
            <span className="font-bold text-[#C25E00] text-[11px]">{progressPercent}%</span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full bg-[#E2E0D8] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#C25E00] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Status Row */}
          <div className="flex items-center justify-between font-mono text-[10.5px]">
            <span className="flex items-center gap-1 text-[#1C1D1B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C25E00] animate-pulse"></span>
              Processing your document...
            </span>
            <span className="text-[#656860]">3.2 MB / 5.4 MB</span>
          </div>

          {/* Subtext */}
          <p className="font-mono text-[10px] text-[#656860] pt-0.5">
            Chunking &amp; generating embeddings
          </p>
        </div>

        {/* 2. SUCCESS TOAST */}
        <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-[#2D6A4F]">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0" />
              <span className="font-sans font-semibold">
                Uploaded <code className="font-mono font-bold">research_paper.pdf</code>
              </span>
            </div>
            <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#166534] font-bold border border-[#BBF7D0]">
              Index ready
            </span>
          </div>
          <p className="font-mono text-[10.5px] text-[#2D6A4F]/80 pl-6">
            18 pages • 84 citations cataloged
          </p>
        </div>

        {/* 3. WARNING TOAST */}
        <div className="p-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#B57614]">
              <AlertTriangle className="w-4 h-4 text-[#B57614] shrink-0" />
              <span className="font-medium">
                File <code className="font-mono font-bold">meeting_notes.md</code> was already uploaded.
              </span>
            </div>
            <button
              onClick={() => onViewExisting && onViewExisting('meeting_notes.md')}
              className="font-mono text-[10px] text-[#B57614] hover:underline shrink-0 font-bold ml-1 cursor-pointer"
            >
              View existing
            </button>
          </div>
          <p className="font-mono text-[10.5px] text-[#B57614]/80 pl-6 leading-tight">
            Overwriting will regenerate 32 vector partitions
          </p>
        </div>

        {/* 4. ERROR TOAST 1 (File size exceeds limit) */}
        <div className="p-3 bg-[#FEF2F2] rounded-xl border border-[#FECACA] space-y-1 text-xs">
          <div className="flex items-center justify-between text-[#9D0208]">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-[#9D0208] shrink-0" />
              <span>File size exceeds 10 MB limit.</span>
            </div>
            <span className="font-mono text-[10.5px] font-bold">14.8 MB</span>
          </div>
          <p className="font-mono text-[10.5px] text-[#9D0208]/80 pl-6 leading-tight">
            Compressed PDFs recommended for academic parsing.
          </p>
        </div>

        {/* 5. ERROR TOAST 2 (Unsupported file format) */}
        <div className="p-3 bg-[#FEF2F2] rounded-xl border border-[#FECACA] space-y-1 text-xs">
          <div className="flex items-center gap-2 text-[#9D0208] font-semibold">
            <XCircle className="w-4 h-4 text-[#9D0208] shrink-0" />
            <span>Unsupported file format.</span>
          </div>
          <p className="font-mono text-[10.5px] text-[#9D0208]/80 pl-6 leading-tight">
            Please upload PDF, MD, or TXT formats only.
          </p>
        </div>

        {/* 6. ERROR TOAST 3 (Could not read file) */}
        <div className="p-3 bg-[#FEF2F2] rounded-xl border border-[#FECACA] space-y-1 text-xs">
          <div className="flex items-center gap-2 text-[#9D0208] font-semibold">
            <Lock className="w-4 h-4 text-[#9D0208] shrink-0" />
            <span>Could not read file.</span>
          </div>
          <p className="font-mono text-[10.5px] text-[#9D0208]/80 pl-6 leading-relaxed">
            Scanned or password-protected PDFs are not supported. Run OCR or remove encryption prior to ingest.
          </p>
        </div>
      </div>
    </div>
  );
};
