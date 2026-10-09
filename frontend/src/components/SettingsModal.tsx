import React from 'react';
import { X, Sliders, Shield, Database, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#FFFFFF] rounded-xl border border-[#E2E0D8] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#C25E00]" />
            <h3 className="text-sm font-bold text-[#1C1D1B]">Workspace Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#656860] hover:text-[#1C1D1B] hover:bg-[#F8F6F0]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Grounding Engine */}
          <div className="p-3 bg-[#F8F6F0] rounded-lg border border-[#E2E0D8] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1C1D1B] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#C25E00]" />
                Zero Hallucination Strictness
              </span>
              <span className="font-mono text-[10px] text-[#C25E00] font-bold">100% (Strict)</span>
            </div>
            <p className="text-[11px] text-[#656860]">
              Requires all synthesis sentences to anchor with verifiable `[n]` citation coordinates.
            </p>
          </div>

          {/* Embedding Chunk Size */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1C1D1B] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#656860]" />
              Chunking Strategy
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg border border-[#C25E00] bg-[#FAF5EE] text-[#C25E00] font-medium">
                <p className="font-semibold text-xs">Semantic Paragraphs</p>
                <p className="text-[10px] text-[#656860] mt-0.5">512 tokens + 64 overlap</p>
              </div>
              <div className="p-2.5 rounded-lg border border-[#E2E0D8] bg-white text-[#1C1D1B] hover:bg-[#F8F6F0] cursor-pointer">
                <p className="font-semibold text-xs">Sentence Level</p>
                <p className="text-[10px] text-[#656860] mt-0.5">128 tokens fine-grained</p>
              </div>
            </div>
          </div>

          {/* Corpus Memory Limit */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[#1C1D1B] font-semibold">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#656860]" />
                Corpus Storage Tier
              </span>
              <span className="font-mono text-[11px] text-[#656860]">Free Tier (500 MB)</span>
            </div>
            <div className="w-full bg-[#E2E0D8] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#C25E00] h-full w-[2%]"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F8F6F0] border-t border-[#E2E0D8] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#FFFFFF] border border-[#E2E0D8] text-[#1C1D1B] hover:bg-neutral-50 cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#C25E00] text-white hover:bg-[#A65000] cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
