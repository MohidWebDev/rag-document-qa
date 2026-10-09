import React from 'react';
import {
  FileText,
  Plus,
  Check,
  ShieldCheck,
  Layers,
  Database
} from 'lucide-react';

interface TargetCorpusPanelProps {
  onAddDocument?: () => void;
  onSelectDocument?: (name: string) => void;
  activeDocName?: string;
}

export const TargetCorpusPanel: React.FC<TargetCorpusPanelProps> = ({
  onAddDocument,
  onSelectDocument,
  activeDocName = 'Q3_Financial_Report.pdf',
}) => {
  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 h-full bg-[#F8F6F0] border-r border-[#E2E0D8] p-3 flex-col justify-between select-none overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#C25E00]" />
              <h3 className="text-sm font-bold text-[#1C1D1B]">Target Corpus</h3>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#E5EFE8] text-[#1E5631] font-bold border border-[#C6DEC9]">
              Active v2
            </span>
          </div>
          <p className="text-[11px] text-[#656860] leading-snug">
            Isolated embedding cluster for corporate synthesis & regulatory verification.
          </p>
        </div>

        {/* Documents Stack */}
        <div className="space-y-2">
          {/* Doc 1: Q3_Fina... ACTIVE */}
          <div
            onClick={() => onSelectDocument && onSelectDocument('Q3_Financial_Report.pdf')}
            className="p-2.5 rounded-lg bg-[#FFFFFF] border-l-3 border-l-[#C25E00] border-y border-r border-[#E2E0D8] shadow-2xs cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#C25E00]" />
                <div>
                  <p className="text-xs font-bold text-[#1C1D1B]">Q3_Fina...</p>
                  <p className="text-[10px] font-mono text-[#656860]">1,420 chunks • 4.2 MB</p>
                </div>
              </div>
              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FAF0E6] text-[#C25E00] border border-[#F0D5BE]">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Doc 2: meeting_notes.md */}
          <div
            onClick={() => onSelectDocument && onSelectDocument('meeting_notes.md')}
            className="p-2.5 rounded-lg bg-[#F8F6F0] hover:bg-[#FFFFFF] border border-[#E2E0D8] transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#656860]" />
                <div>
                  <p className="text-xs font-medium text-[#1C1D1B]">meeting_note...</p>
                  <p className="text-[10px] font-mono text-[#656860]">284 chunks • 312 KB</p>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Check className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>

          {/* Doc 3: project_roadmap.txt */}
          <div
            onClick={() => onSelectDocument && onSelectDocument('project_roadmap.txt')}
            className="p-2.5 rounded-lg bg-[#F8F6F0] hover:bg-[#FFFFFF] border border-[#E2E0D8] transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#656860]" />
                <div>
                  <p className="text-xs font-medium text-[#1C1D1B]">project_road...</p>
                  <p className="text-[10px] font-mono text-[#656860]">112 chunks • 98 KB</p>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Check className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>

          {/* + Add Document Button */}
          <button
            onClick={onAddDocument}
            className="w-full py-2 bg-[#EFEAE1] hover:bg-[#EAE4D8] border border-[#E2E0D8] rounded-lg text-xs font-bold text-[#1C1D1B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Document</span>
          </button>
        </div>

        {/* Telemetry / Context Quota Stats */}
        <div className="p-3 bg-[#EFEAE1]/60 rounded-lg border border-[#E2E0D8] space-y-1.5 font-mono text-[10px] text-[#656860]">
          <div className="flex justify-between">
            <span>Corpus Context Quota</span>
            <span className="font-bold text-[#1C1D1B]">1,816 / 5,000 Chunks</span>
          </div>
          <div className="w-full bg-[#E2E0D8] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#C25E00] h-full w-[36%]"></div>
          </div>
          <p className="text-[9.5px] text-[#656860] pt-0.5">
            Vector dimension: 1,536 (Cosine sim)
          </p>
        </div>
      </div>

      {/* Lower Card: Strict Grounding Summary */}
      <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E2E0D8] shadow-2xs mt-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1D1B]">
          <ShieldCheck className="w-4 h-4 text-[#C25E00]" />
          <span>Strict Grounding</span>
        </div>
        <p className="text-[10.5px] text-[#656860] leading-snug">
          Strict synthesis ensures that assertions lacking direct citation proofs are rejected automatically.
        </p>

        <div className="pt-2 border-t border-[#E2E0D8] grid grid-cols-2 gap-2 text-left font-mono">
          <div>
            <p className="text-base font-bold text-[#1C1D1B]">99.8%</p>
            <p className="text-[9.5px] text-[#656860]">Confidence Floor</p>
          </div>
          <div>
            <p className="text-base font-bold text-emerald-700">0%</p>
            <p className="text-[9.5px] text-[#656860]">Hallucination Risk</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
