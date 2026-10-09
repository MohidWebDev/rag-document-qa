import React, { useEffect, useState } from 'react';
import { Search, FileText, Upload, Sparkles, X, BookOpen, ShieldCheck } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          onSelectAction('toggle-open');
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSelectAction]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'upload',
      title: 'Upload Document (PDF, MD, TXT)',
      desc: 'Index a new file for semantic citation',
      icon: <Upload className="w-4 h-4 text-[#C25E00]" />,
    },
    {
      id: 'sample-scientific',
      title: 'Load Sample: Attention Is All You Need (Vaswani et al.)',
      desc: 'Scientific paper with 42 citations',
      icon: <FileText className="w-4 h-4 text-[#C25E00]" />,
    },
    {
      id: 'sample-legal',
      title: 'Load Sample: Master Services Agreement v3.4',
      desc: 'Legal brief with clause annotations',
      icon: <FileText className="w-4 h-4 text-[#C25E00]" />,
    },
    {
      id: 'verify-grounding',
      title: 'Verify Grounding Confidence Invariant',
      desc: 'Audit chunk vector index integrity',
      icon: <ShieldCheck className="w-4 h-4 text-[#C25E00]" />,
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-start justify-center pt-24 px-4">
      <div className="w-full max-w-lg bg-[#FFFFFF] rounded-xl border border-[#E2E0D8] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search header */}
        <div className="p-3 border-b border-[#E2E0D8] flex items-center gap-2.5">
          <Search className="w-4 h-4 text-[#656860]" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type a command or search documents..."
            className="flex-1 bg-transparent text-sm text-[#1C1D1B] placeholder:text-[#656860] focus:outline-hidden font-sans"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-[#656860] hover:text-[#1C1D1B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-72 overflow-y-auto space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#656860]">
            Quick Actions
          </div>
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#656860]">
              No actions matching "{searchTerm}"
            </div>
          ) : (
            filtered.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  onSelectAction(action.id);
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#F8F6F0] text-left transition-colors cursor-pointer group"
              >
                <div className="p-1.5 rounded-md bg-[#FAF0E6] border border-[#F0D5BE] shrink-0 mt-0.5">
                  {action.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#1C1D1B] group-hover:text-[#C25E00] transition-colors">
                    {action.title}
                  </p>
                  <p className="text-[11px] text-[#656860] truncate">
                    {action.desc}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3 py-2 bg-[#F8F6F0] border-t border-[#E2E0D8] flex items-center justify-between text-[11px] font-mono text-[#656860]">
          <span>Navigation: ↑ ↓ Enter</span>
          <span>Esc to dismiss</span>
        </div>
      </div>
    </div>
  );
};
