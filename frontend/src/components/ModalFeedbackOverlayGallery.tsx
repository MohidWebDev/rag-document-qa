import React from 'react';
import { UploadFeedbackGallery } from './UploadFeedbackGallery';
import {
  Trash2,
  X,
  AlertTriangle,
  FileCode,
  Link2Off,
  Info
} from 'lucide-react';

interface ModalFeedbackOverlayGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  documentName?: string;
  embeddingsCount?: number;
  citationsCount?: number;
  onViewExisting?: (docName: string) => void;
}

export const ModalFeedbackOverlayGallery: React.FC<ModalFeedbackOverlayGalleryProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  documentName = 'Q3_Financial_Report.pdf',
  embeddingsCount = 1420,
  citationsCount = 14,
  onViewExisting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Centered Gallery Layout: Upload Feedback Card + Delete Confirmation Dialog */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 sm:gap-6 max-w-5xl w-full my-auto animate-in fade-in zoom-in-95 duration-150 py-4">
        {/* Left Side: Upload State List / Feedback Gallery */}
        <div className="w-full max-w-sm lg:w-[360px] shrink-0">
          <UploadFeedbackGallery onViewExisting={onViewExisting} />
        </div>

        {/* Right Side: Delete Confirmation Dialog Modal */}
        <div className="w-full max-w-lg bg-[#FFFFFF] rounded-2xl border border-[#E2E0D8] shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 select-none">
          {/* Top Header Row with Icon and Close Button */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2.5 sm:gap-3.5">
              {/* Red Warning/Trash Icon in Pink Box */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FEE2E2] text-[#9D0208] flex items-center justify-center shrink-0 border border-[#FECACA]">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <span className="font-mono text-[9.5px] sm:text-[10px] font-bold tracking-wider text-[#9D0208] uppercase">
                  CORPUS MODIFICATION
                </span>
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-[#1C1D1B]">
                  Delete Document?
                </h2>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-lg text-[#656860] hover:text-[#1C1D1B] hover:bg-[#F8F6F0] transition-colors cursor-pointer"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Text */}
          <div className="space-y-1.5 text-xs sm:text-sm text-[#1C1D1B]">
            <p className="leading-relaxed">
              Are you sure you want to delete{' '}
              <code className="font-mono font-semibold px-1 py-0.5 rounded bg-[#FAF8F5] border border-[#E2E0D8] text-[#1C1D1B] break-all">
                {documentName}
              </code>
              ? This action cannot be undone.
            </p>
            <p className="text-[11px] sm:text-xs text-[#656860] leading-relaxed">
              Deleting this document permanently unbinds it from this workspace's knowledge graph.
            </p>
          </div>

          {/* Consequence Breakdown Card */}
          <div className="p-3 sm:p-4 bg-[#FAF8F5] rounded-xl border border-[#E2E0D8] space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between font-mono text-[10px] sm:text-[10.5px]">
              <span className="font-bold text-[#656860] uppercase tracking-wider">
                CONSEQUENCE BREAKDOWN
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#9D0208]">
                <AlertTriangle className="w-3 h-3" />
                <span>Irreversible</span>
              </span>
            </div>

            {/* 2 Stat Boxes Side-by-Side */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Box 1: Embeddings */}
              <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-lg border border-[#E2E0D8] space-y-1">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-[#1C1D1B]">
                  <FileCode className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#9D0208] shrink-0" />
                  <span className="font-mono truncate">{embeddingsCount.toLocaleString()} Embeddings</span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-mono text-[#656860]">
                  Vector chunks unindexed
                </p>
              </div>

              {/* Box 2: Citations */}
              <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-lg border border-[#E2E0D8] space-y-1">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-[#1C1D1B]">
                  <Link2Off className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#9D0208] shrink-0" />
                  <span className="font-mono truncate">{citationsCount} Citations</span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-mono text-[#656860]">
                  Active chat links severed
                </p>
              </div>
            </div>

            {/* Footnote Disclaimer */}
            <div className="flex items-start gap-1.5 text-[10px] sm:text-[11px] font-mono text-[#656860] pt-0.5">
              <Info className="w-3 h-3 shrink-0 text-[#656860] mt-0.5" />
              <p className="leading-snug">
                Workspace synthetic answers citing this source maintain historical text with a severed citation flag.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 pt-1">
            {/* Cancel Secondary Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs sm:text-sm font-semibold text-[#1C1D1B] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Delete Primary Destructive Button (Red) */}
            <button
              type="button"
              onClick={onConfirmDelete}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#9D0208] hover:bg-[#800206] active:scale-95 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Delete Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
