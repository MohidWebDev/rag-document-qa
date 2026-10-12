import React, { useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  RefreshCw,
  X,
  WifiOff,
} from 'lucide-react';
import { UploadItem, formatBytes, plural } from '../types';

interface UploadFeedbackGalleryProps {
  items: UploadItem[];
  allowedExtensions: string[];
  maxFileSizeMb: number;
  onChooseFiles: () => void;
  onDropFiles: (files: File[]) => void;
  onDismissItem: (id: string) => void;
  onOpenDocument: (docId: string, docName: string) => void;
  onClose?: () => void;
}

const DismissButton: React.FC<{ onClick: () => void; className: string }> = ({ onClick, className }) => (
  <button onClick={onClick} className={`p-0.5 rounded shrink-0 cursor-pointer ${className}`} title="Dismiss" aria-label="Dismiss">
    <X className="w-3 h-3" />
  </button>
);

export const UploadFeedbackGallery: React.FC<UploadFeedbackGalleryProps> = ({
  items,
  allowedExtensions,
  maxFileSizeMb,
  onChooseFiles,
  onDropFiles,
  onDismissItem,
  onOpenDocument,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const formats = allowedExtensions.map((e) => e.replace('.', '').toUpperCase()).join(', ');

  return (
    <div className="w-full bg-[#FFFFFF] rounded-2xl border border-[#E2E0D8] p-4 shadow-xl space-y-3.5 select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Card Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#FAF0E6] text-[#C25E00] flex items-center justify-center">
              <UploadCloud className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-[#1C1D1B]">Upload Documents</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#656860] hover:text-[#1C1D1B] hover:bg-[#F8F6F0] cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-[#656860] leading-snug">
          {formats} files up to {maxFileSizeMb} MB. Each file is parsed, chunked and embedded so you can ask
          questions about it.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={onChooseFiles}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const files = Array.from(e.dataTransfer.files ?? []);
          if (files.length) onDropFiles(files);
        }}
        className={`p-5 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
          isDragging ? 'border-[#C25E00] bg-[#FAF0E6]' : 'border-[#E2E0D8] bg-[#FAF8F5] hover:border-[#C25E00]/60'
        }`}
      >
        <UploadCloud className="w-6 h-6 text-[#C25E00] mx-auto mb-1.5" />
        <p className="text-xs font-bold text-[#1C1D1B]">Drop files here or click to browse</p>
        <p className="text-[10.5px] font-mono text-[#656860] mt-0.5">{allowedExtensions.join(' · ')}</p>
      </div>

      {/* Upload status rows, newest first */}
      {items.length > 0 && (
        <div className="space-y-2.5 max-h-[45vh] overflow-y-auto">
          {items.map((item) => {
            if (item.status === 'uploading' || item.status === 'processing') {
              const percent = Math.round(item.progress * 100);
              return (
                <div key={item.id} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E2E0D8] space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#1C1D1B] min-w-0">
                      <RefreshCw className="w-3.5 h-3.5 text-[#C25E00] animate-spin shrink-0" />
                      <span className="truncate">{item.fileName}</span>
                    </div>
                    <span className="font-bold text-[#C25E00] text-[11px] shrink-0 ml-2">
                      {item.status === 'uploading' ? `${percent}%` : 'Indexing'}
                    </span>
                  </div>

                  <div className="w-full bg-[#E2E0D8] h-1.5 rounded-full overflow-hidden">
                    {item.status === 'uploading' ? (
                      <div
                        className="bg-[#C25E00] h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      ></div>
                    ) : (
                      <div className="bg-[#C25E00] h-full w-full rounded-full animate-pulse"></div>
                    )}
                  </div>

                  <div className="flex items-center justify-between font-mono text-[10.5px]">
                    <span className="flex items-center gap-1 text-[#1C1D1B]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C25E00] animate-pulse"></span>
                      {item.status === 'uploading' ? 'Uploading...' : 'Processing your document...'}
                    </span>
                    <span className="text-[#656860]">{formatBytes(item.bytes)}</span>
                  </div>

                  {item.status === 'processing' && (
                    <p className="font-mono text-[10px] text-[#656860] pt-0.5">Chunking &amp; generating embeddings</p>
                  )}
                </div>
              );
            }

            if (item.status === 'success') {
              return (
                <div key={item.id} className="p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-medium text-[#2D6A4F] min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                      <span className="font-sans font-semibold truncate">
                        Uploaded <code className="font-mono font-bold">{item.fileName}</code>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.docId && (
                        <button
                          onClick={() => onOpenDocument(item.docId!, item.fileName)}
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#166534] font-bold border border-[#BBF7D0] hover:bg-[#BBF7D0] cursor-pointer"
                          title="Read the extracted text"
                        >
                          Open
                        </button>
                      )}
                      <DismissButton onClick={() => onDismissItem(item.id)} className="text-[#2D6A4F] hover:bg-[#DCFCE7]" />
                    </div>
                  </div>
                  <p className="font-mono text-[10.5px] text-[#2D6A4F]/80 pl-6">
                    Ready for questions: {plural(item.segmentCount ?? 0, item.fileName.toLowerCase().endsWith('.pdf') ? 'page' : 'section')} •{' '}
                    {plural(item.chunkCount ?? 0, 'chunk')}
                  </p>
                </div>
              );
            }

            if (item.status === 'duplicate') {
              return (
                <div key={item.id} className="p-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[#B57614] min-w-0">
                      <AlertTriangle className="w-4 h-4 text-[#B57614] shrink-0" />
                      <span className="font-medium">
                        File <code className="font-mono font-bold break-all">{item.fileName}</code> was already
                        uploaded.
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.docId && (
                        <button
                          onClick={() => onOpenDocument(item.docId!, item.existingName ?? item.fileName)}
                          className="font-mono text-[10px] text-[#B57614] hover:underline font-bold ml-1 cursor-pointer"
                        >
                          Open existing
                        </button>
                      )}
                      <DismissButton onClick={() => onDismissItem(item.id)} className="text-[#B57614] hover:bg-[#FEF3C7]" />
                    </div>
                  </div>
                  {item.existingName && item.existingName !== item.fileName && (
                    <p className="font-mono text-[10.5px] text-[#B57614]/80 pl-6 leading-tight">
                      Same content as <code>{item.existingName}</code>
                    </p>
                  )}
                </div>
              );
            }

            // Errors
            const Icon =
              item.errorKind === 'unsupported'
                ? XCircle
                : item.errorKind === 'unreadable'
                  ? Lock
                  : item.errorKind === 'offline'
                    ? WifiOff
                    : AlertTriangle;
            const title =
              item.errorKind === 'too-large'
                ? `File size exceeds ${maxFileSizeMb} MB limit.`
                : item.errorKind === 'unsupported'
                  ? 'Unsupported file format.'
                  : item.errorKind === 'unreadable'
                    ? 'Could not read file.'
                    : `Could not upload ${item.fileName}.`;
            return (
              <div key={item.id} className="p-3 bg-[#FEF2F2] rounded-xl border border-[#FECACA] space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2 text-[#9D0208]">
                  <div className="flex items-center gap-2 font-semibold min-w-0">
                    <Icon className="w-4 h-4 text-[#9D0208] shrink-0" />
                    <span className="truncate">{title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.errorKind === 'too-large' && (
                      <span className="font-mono text-[10.5px] font-bold">{formatBytes(item.bytes)}</span>
                    )}
                    <DismissButton onClick={() => onDismissItem(item.id)} className="text-[#9D0208] hover:bg-[#FEE2E2]" />
                  </div>
                </div>
                <p className="font-mono text-[10.5px] text-[#9D0208]/80 pl-6 leading-relaxed break-words">
                  {item.errorKind === 'too-large' || item.errorKind === 'unsupported' ? (
                    <>
                      <span className="text-[#1C1D1B]/70">{item.fileName}</span> — {item.message}
                    </>
                  ) : (
                    item.message
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
