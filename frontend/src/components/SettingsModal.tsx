import React from 'react';
import { X, Sliders, Shield, Database, Cpu } from 'lucide-react';
import type { ApiConfig } from '../api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config }) => {
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

        {/* Settings Body: read from the backend's /config */}
        <div className="p-5 space-y-4 text-xs">
          {!config ? (
            <p className="text-[11px] text-[#656860]">Settings are unavailable while the server is offline.</p>
          ) : (
            <>
              <div className="p-3 bg-[#F8F6F0] rounded-lg border border-[#E2E0D8] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1C1D1B] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#C25E00]" />
                    Strict Grounding
                  </span>
                  <span className="font-mono text-[10px] text-[#C25E00] font-bold">Always on</span>
                </div>
                <p className="text-[11px] text-[#656860]">
                  Answers use only retrieved passages and cite them as <code>[n]</code>. Passages below{' '}
                  {Math.round((1 - config.retrieval_max_distance) * 100)}% similarity are ignored; the top{' '}
                  {config.retrieval_k} are sent to <code>{config.chat_model}</code>.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-[#1C1D1B] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#656860]" />
                  Chunking &amp; Embeddings
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg border border-[#C25E00] bg-[#FAF5EE] text-[#C25E00] font-medium">
                    <p className="font-semibold text-xs">Recursive character chunks</p>
                    <p className="text-[10px] text-[#656860] mt-0.5">
                      {config.chunk_size} chars + {config.chunk_overlap} overlap
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#E2E0D8] bg-white text-[#1C1D1B]">
                    <p className="font-semibold text-xs font-mono truncate">{config.embed_model}</p>
                    <p className="text-[10px] text-[#656860] mt-0.5">{config.embed_dimensions} dimensions</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[#1C1D1B] font-semibold pt-1">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#656860]" />
                  Upload limits
                </span>
                <span className="font-mono text-[11px] text-[#656860]">
                  {config.allowed_extensions.join(' ')} • max {config.max_file_size_mb} MB
                </span>
              </div>
              <p className="text-[10.5px] text-[#656860]">These values are set in <code>backend/config.py</code>.</p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F8F6F0] border-t border-[#E2E0D8] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#C25E00] text-white hover:bg-[#A65000] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
