import React from 'react';
import { UploadCloud, MessageSquare, BookOpen } from 'lucide-react';

interface EmptyStateHeroProps {
  hasDocuments: boolean;
  /** What questions will search: a file name, or "all documents" */
  scopeLabel: string;
  onUploadClick: () => void;
}

const STEPS = [
  { icon: UploadCloud, title: 'Upload', text: 'Add PDF, Markdown or text files. They are split into chunks and indexed.' },
  { icon: MessageSquare, title: 'Ask', text: 'Ask about all your documents, or pick one on the left to ask only about it.' },
  {
    icon: BookOpen,
    title: 'Check the sources',
    text: 'Answers cite the passages they used as [n]. Click one to read it in the document.',
  },
];

export const EmptyStateHero: React.FC<EmptyStateHeroProps> = ({ hasDocuments, scopeLabel, onUploadClick }) => (
  <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto text-center select-none">
    <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1C1D1B] max-w-xl">
      {hasDocuments ? 'Ask a question about your documents' : 'Upload a document to get started'}
    </h1>

    <p className="text-sm sm:text-base text-[#656860] mt-2.5 mb-6 max-w-lg leading-relaxed">
      {hasDocuments ? (
        <>
          Your next question will search <strong className="text-[#1C1D1B]">{scopeLabel}</strong>. If the answer isn't
          in there, AskMyDocs will say so instead of guessing.
        </>
      ) : (
        'AskMyDocs answers questions using only the files you upload, and shows where each answer came from.'
      )}
    </p>

    {!hasDocuments && (
      <button
        onClick={onUploadClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#8A3E00] hover:bg-[#723200] text-white text-sm font-semibold shadow-xs cursor-pointer mb-8"
      >
        <UploadCloud className="w-4 h-4" />
        Upload a document
      </button>
    )}

    <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <li key={title} className="p-4 bg-[#FFFFFF] border border-[#E2E0D8] rounded-xl shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#FAF0E6] border border-[#F0D5BE] text-[#C25E00] flex items-center justify-center">
              <Icon className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-[#1C1D1B]">
              {i + 1}. {title}
            </span>
          </div>
          <p className="text-[11.5px] text-[#656860] leading-relaxed">{text}</p>
        </li>
      ))}
    </ol>
  </div>
);
