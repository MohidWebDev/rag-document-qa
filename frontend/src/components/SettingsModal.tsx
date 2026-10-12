import React, { useEffect } from 'react';
import { X, Settings, Shield } from 'lucide-react';
import type { ApiConfig } from '../api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig | null;
}

/** Read-only view of the backend's /config: how documents are indexed and answers are made. */
export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rows: [string, React.ReactNode][] = config
    ? [
        ['Answer model', <code>{config.chat_model}</code>],
        ['Embedding model', <code>{config.embed_model} ({config.embed_dimensions} dimensions)</code>],
        ['Chunk size', `${config.chunk_size} characters, ${config.chunk_overlap} overlap`],
        ['Passages per question', `Up to ${config.retrieval_k}`],
        ['Minimum similarity', `${Math.round((1 - config.retrieval_max_distance) * 100)}%`],
        ['Allowed files', `${config.allowed_extensions.join(', ')} up to ${config.max_file_size_mb} MB`],
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FFFFFF] rounded-xl border border-[#E2E0D8] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-4 border-b border-[#E2E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#C25E00]" />
            <h3 className="text-sm font-bold text-[#1C1D1B]">Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#656860] hover:text-[#1C1D1B] hover:bg-[#F8F6F0]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {!config ? (
            <p className="text-[11px] text-[#656860]">Settings are unavailable while the server is offline.</p>
          ) : (
            <>
              <div className="p-3 bg-[#F8F6F0] rounded-lg border border-[#E2E0D8] space-y-1.5">
                <p className="font-semibold text-[#1C1D1B] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#C25E00]" />
                  How answers are made
                </p>
                <p className="text-[11px] text-[#656860] leading-relaxed">
                  Your question is compared with every chunk of your documents. Chunks at least{' '}
                  {Math.round((1 - config.retrieval_max_distance) * 100)}% similar (up to {config.retrieval_k}) are
                  sent to the model, which must answer only from them and cite them as [n]. If no chunk is similar
                  enough, you get “I couldn't find the answer” instead of a guess. Answers can still contain mistakes,
                  so check the cited sources.
                </p>
              </div>

              <dl className="divide-y divide-[#E2E0D8] border border-[#E2E0D8] rounded-lg">
                {rows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 px-3 py-2">
                    <dt className="text-[#656860]">{label}</dt>
                    <dd className="font-mono text-[11px] text-[#1C1D1B] text-right">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-[10.5px] text-[#656860]">
                These are read-only here. Change them in <code>backend/config.py</code> and restart the server.
              </p>
            </>
          )}
        </div>

        <div className="p-3 bg-[#F8F6F0] border-t border-[#E2E0D8] flex justify-end">
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
