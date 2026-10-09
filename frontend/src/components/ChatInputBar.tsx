import React, { useState } from 'react';
import { Paperclip, Mic, ArrowUp, Lock, ShieldCheck } from 'lucide-react';

interface ChatInputBarProps {
  isDisabled?: boolean;
  onSendMessage?: (message: string) => void;
  onAttachClick?: () => void;
  placeholder?: string;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  isDisabled = false,
  onSendMessage,
  onAttachClick,
  placeholder = 'Ask a question about this document or synthesized corpus...',
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled || !inputText.trim()) return;
    if (onSendMessage) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-3 sm:pb-5 pt-2 select-none">
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Main Input Card Container */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E0D8] p-3 sm:p-3.5 shadow-xs focus-within:border-[#C25E00]/60 focus-within:ring-2 focus-within:ring-[#C25E00]/10 transition-all">
          {/* Textarea / Input Field */}
          <input
            type="text"
            value={inputText}
            disabled={isDisabled}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-xs sm:text-sm text-[#1C1D1B] placeholder:text-[#656860] focus:outline-hidden pb-2.5 sm:pb-3"
          />

          {/* Bottom Action Strip inside the input card */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E2E0D8]/50">
            {/* Left controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Attach Button */}
              <button
                type="button"
                onClick={onAttachClick}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-[#F8F6F0] border border-[#E2E0D8] text-[11px] sm:text-xs font-medium text-[#1C1D1B] hover:bg-[#EFECE6] transition-colors cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5 text-[#656860]" />
                <span>Attach</span>
              </button>

              {/* Strict Citing Badge */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#FFF3E0] border border-[#FFE0B2] text-[10.5px] sm:text-xs font-medium text-[#C25E00]">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Strict Citing</span>
                <span className="xs:hidden">Strict</span>
              </div>

              {/* Mic Icon */}
              <button
                type="button"
                className="p-1 rounded-full text-[#656860] hover:text-[#1C1D1B] hover:bg-[#F8F6F0] transition-colors"
                title="Voice input"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <span className="font-mono text-[10.5px] sm:text-[11px] text-[#656860] hidden md:inline">
                Press ↵ Enter to synthesize
              </span>

              {/* Send Button */}
              <button
                type="submit"
                disabled={isDisabled || !inputText.trim()}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  inputText.trim()
                    ? 'bg-[#8A3E00] text-white hover:bg-[#723200] cursor-pointer shadow-xs'
                    : 'bg-[#8A3E00] text-white cursor-pointer opacity-90'
                }`}
                title="Send query"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.4]" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[10.5px] font-mono text-[#656860] text-center pt-0.5 px-2">
          <Lock className="w-3 h-3 text-[#656860] shrink-0" />
          <span className="truncate sm:whitespace-normal">
            AskMyDocs guarantees citation-backed grounded answers.
          </span>
        </div>
      </form>
    </div>
  );
};
