import React, { useRef, useState } from 'react';
import {
  Upload,
  SlidersHorizontal,
  FileText,
  Trash2,
  FileCode,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { DocumentItem } from '../types';

interface WorkspaceSidebarProps {
  documents: DocumentItem[];
  activeDocumentId: string;
  onSelectDocument: (id: string) => void;
  onAddDocument: (file: File) => void;
  onRemoveDocument: (id: string) => void;
  isCollapsed?: boolean;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  documents,
  activeDocumentId,
  onSelectDocument,
  onAddDocument,
  onRemoveDocument,
  isCollapsed = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddDocument(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddDocument(e.target.files[0]);
      e.target.value = '';
    }
  };

  // Helper icon for doc types
  const renderDocIcon = (type: DocumentItem['type'], isActive: boolean) => {
    if (type === 'pdf') {
      return (
        <div className="w-7 h-7 rounded-md bg-[#FAF0E6] border border-[#F0D5BE] flex items-center justify-center shrink-0 text-[#C25E00]">
          <span className="font-mono text-[9px] font-bold tracking-tighter">PDF</span>
        </div>
      );
    }
    if (type === 'md') {
      return (
        <div className="w-7 h-7 rounded-md bg-[#F1F0EC] border border-[#E2E0D8] flex items-center justify-center shrink-0 text-[#656860]">
          <FileCode className="w-3.5 h-3.5" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-md bg-[#F1F0EC] border border-[#E2E0D8] flex items-center justify-center shrink-0 text-[#656860]">
        <FileText className="w-3.5 h-3.5" />
      </div>
    );
  };

  // Total corpus size calculation
  const totalKB = documents.reduce((acc, d) => acc + (d.bytes || 1000), 0);
  const formattedMB = (totalKB / (1024 * 1024)).toFixed(2);

  if (isCollapsed) {
    return null;
  }

  return (
    <aside className="w-[280px] shrink-0 h-screen bg-[#F8F6F0] border-r border-[#E2E0D8] flex flex-col justify-between p-3 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.md,.txt"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="space-y-4">
        {/* Top "+ Add Document" Upload Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-xl border border-dashed p-4 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-[#C25E00] bg-[#FAF5EE] ring-2 ring-[#C25E00]/20'
              : 'border-[#E2E0D8] bg-[#F1ECE3]/60 hover:bg-[#EFEAE1]'
          }`}
        >
          <div className="flex flex-col items-center">
            {/* Upload Circle Icon */}
            <div className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E2E0D8] flex items-center justify-center text-[#C25E00] mb-2 shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
            </div>

            <p className="text-xs font-bold text-[#1C1D1B]">
              + Add Document
            </p>
            <p className="text-[10.5px] font-mono text-[#656860] mt-1">
              Drop PDF, TXT or MD (up to 50MB)
            </p>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold tracking-wider text-[#656860] uppercase">
              INDEXED CORPUS
            </span>
            <span className="font-mono text-[11px] text-[#656860]">
              {documents.length}
            </span>
          </div>
          <button
            className="p-1 rounded text-[#656860] hover:text-[#1C1D1B] transition-colors"
            title="Filter documents"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Document List */}
        <div className="space-y-1.5">
          {documents.map((doc) => {
            const isActive = doc.id === activeDocumentId;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                className={`group relative flex items-center justify-between p-2.5 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FFFFFF] shadow-2xs border-l-3 border-l-[#C25E00] border-y border-r border-[#E2E0D8]'
                    : 'hover:bg-[#EFEAE1]/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {renderDocIcon(doc.type, isActive)}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={`text-xs truncate ${
                          isActive ? 'font-bold text-[#1C1D1B]' : 'font-medium text-[#1C1D1B]'
                        }`}
                        title={doc.name}
                      >
                        {doc.name}
                      </p>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C25E00] shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-[#656860] mt-0.5">
                      {doc.sizeFormatted} • {doc.date}
                    </p>
                  </div>
                </div>

                {/* Trash icon on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveDocument(doc.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#656860] hover:text-red-600 transition-opacity rounded hover:bg-neutral-100/50"
                  title="Remove document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer: Corpus Capacity */}
      <div className="p-3 bg-[#EFEAE1]/80 rounded-xl border border-[#E2E0D8] space-y-2">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="font-semibold text-[#1C1D1B]">Corpus Capacity</span>
          <span className="text-[#C25E00] font-bold">
            {formattedMB} MB <span className="text-[#656860] font-normal">/ 100 MB</span>
          </span>
        </div>

        {/* Progress Bar with indicator */}
        <div className="w-full bg-[#E2E0D8] h-1.5 rounded-full overflow-hidden relative">
          <div
            className="bg-[#C25E00] h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.max(3, parseFloat(formattedMB) * 1.5))}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[#656860] pt-0.5">
          <span>{documents.length} Documents active</span>
          <span className="flex items-center gap-1 text-[#1C1D1B]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Embeddings synced
          </span>
        </div>
      </div>
    </aside>
  );
};
