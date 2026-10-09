import React from 'react';
import {
  ShieldCheck,
  Search,
  FileText,
  Calendar,
  Lightbulb,
  FileSearch
} from 'lucide-react';
import { PromptArchetype } from '../types';

interface EmptyStateHeroProps {
  onSelectPrompt: (promptText: string) => void;
  onTriggerUploadClick?: () => void;
}

export const EmptyStateHero: React.FC<EmptyStateHeroProps> = ({
  onSelectPrompt,
}) => {
  const examplePrompts: { id: string; text: string; icon: React.ReactNode }[] = [
    {
      id: 'summarize',
      text: 'Summarize main points',
      icon: <FileText className="w-4 h-4 text-[#C25E00]" />,
    },
    {
      id: 'dates',
      text: 'Find key dates & timeline',
      icon: <Calendar className="w-4 h-4 text-[#C25E00]" />,
    },
    {
      id: 'conclusions',
      text: 'What are the core conclusions?',
      icon: <Lightbulb className="w-4 h-4 text-[#C25E00]" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto text-center select-none">
      {/* 1. Calm Research Illustration: Strict Grounding Card */}
      <div className="relative w-full max-w-[480px] mb-8">
        {/* Grounding Illustration Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-xl p-5 shadow-xs text-left relative overflow-hidden">
          {/* Card Top Header */}
          <div className="flex items-center justify-between mb-4">
            {/* Window control dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2E0D8]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2E0D8]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2E0D8]"></span>
            </div>

            {/* Strict Grounding Tag */}
            <div className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#C25E00] tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Strict Grounding</span>
            </div>
          </div>

          {/* Skeleton Paragraph with Citations */}
          <div className="space-y-3 mb-4">
            {/* Line 1 */}
            <div className="w-full h-3 rounded-full bg-[#EBE8DF]"></div>

            {/* Line 2 with citation [1] p. 42 */}
            <div className="flex items-center gap-2">
              <div className="w-2/5 h-3 rounded-full bg-[#EBE8DF]"></div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-[#C25E00] bg-[#FAF3EA] text-[#C25E00] text-[10px] font-mono font-semibold tracking-tight shrink-0 shadow-2xs">
                [1] p. 42
              </span>
              <div className="w-2/5 h-3 rounded-full bg-[#EBE8DF]"></div>
            </div>

            {/* Line 3 with citation [2] § 8.3 */}
            <div className="flex items-center gap-2">
              <div className="w-1/4 h-3 rounded-full bg-[#EBE8DF]"></div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-[#C25E00] bg-[#FAF3EA] text-[#C25E00] text-[10px] font-mono font-semibold tracking-tight shrink-0 shadow-2xs">
                [2] § 8.3
              </span>
              <div className="w-1/2 h-3 rounded-full bg-[#EBE8DF]"></div>
            </div>
          </div>

          {/* Quoted Callout Box */}
          <div className="p-3 bg-[#F8F6F0] border-l-2 border-[#C25E00] rounded-r-lg flex items-start gap-2.5">
            <FileSearch className="w-4 h-4 text-[#C25E00] shrink-0 mt-0.5" />
            <p className="text-[11px] font-mono text-[#656860] leading-snug">
              “Direct semantic anchoring guarantees every sentence points back to verified...”
            </p>
          </div>
        </div>

        {/* Floating Magnifying Glass Circle Badge */}
        <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-[#C25E00] text-white flex items-center justify-center shadow-md ring-4 ring-[#F8F6F0]">
          <Search className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>

      {/* 2. Main Title */}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1D1B] max-w-xl">
        Upload a document to get started
      </h1>

      {/* 3. Subtitle */}
      <p className="text-base text-[#656860] mt-2.5 mb-5 max-w-lg leading-relaxed">
        Ask targeted questions, synthesize findings, and extract verified answers cited directly from your files.
      </p>

      {/* 4. Verifiable Badges Row */}
      <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E2E0D8] text-xs text-[#656860] shadow-2xs mb-7">
        <span className="inline-flex items-center gap-1.5 font-medium text-[#1C1D1B]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C25E00]" />
          Source Grounded
        </span>
        <span className="text-[#E2E0D8]">·</span>
        <span className="font-mono text-[#C25E00] font-semibold text-[11px]">
          [1] Verifiable Citations
        </span>
        <span className="text-[#E2E0D8]">·</span>
        <span>Zero Hallucination Mode</span>
      </div>

      {/* 5. Prompt Archetypes Section */}
      <div className="w-full max-w-xl">
        <p className="text-[10px] font-mono uppercase tracking-wider text-[#656860] mb-3">
          COMMON RETRIEVAL ARCHETYPES
        </p>

        {/* 3 Clickable Example Prompt Chips */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          {examplePrompts.slice(0, 2).map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt.text)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFFFFF] border border-[#E2E0D8] hover:border-[#C25E00] hover:text-[#C25E00] rounded-lg text-xs font-medium text-[#1C1D1B] transition-all shadow-2xs cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition-transform">
                {prompt.icon}
              </span>
              <span>{prompt.text}</span>
            </button>
          ))}
        </div>

        {/* Third prompt centered below */}
        <div className="mt-2.5 flex justify-center">
          <button
            onClick={() => onSelectPrompt(examplePrompts[2].text)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFFFF] border border-[#E2E0D8] hover:border-[#C25E00] hover:text-[#C25E00] rounded-lg text-xs font-medium text-[#1C1D1B] transition-all shadow-2xs cursor-pointer group"
          >
            <span className="group-hover:scale-110 transition-transform">
              {examplePrompts[2].icon}
            </span>
            <span>{examplePrompts[2].text}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
