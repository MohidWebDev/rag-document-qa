import React, { useState } from 'react';
import { Paperclip, ArrowUp, Info, Square } from 'lucide-react';

/** Matches AskRequest.question max_length in backend/main.py */
const MAX_QUESTION_LENGTH = 1000;

interface ChatInputBarProps {
  isDisabled?: boolean;
  /** An answer is on its way: typing is allowed, sending is not */
  isBusy?: boolean;
  onSendMessage?: (message: string) => void;
  /** Shown as a Stop button while isBusy */
  onStop?: () => void;
  onAttachClick?: () => void;
  placeholder?: string;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  isDisabled = false,
  isBusy = false,
  onSendMessage,
  onStop,
  onAttachClick,
  placeholder = 'Ask a question about this document or synthesized corpus...',
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled || isBusy || !inputText.trim()) return;
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
            maxLength={MAX_QUESTION_LENGTH}
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
                <span>Upload</span>
              </button>

            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <span className="font-mono text-[10.5px] sm:text-[11px] text-[#656860] hidden md:inline">
                {inputText.length > MAX_QUESTION_LENGTH * 0.8
                  ? `${inputText.length} / ${MAX_QUESTION_LENGTH}`
                  : 'Press Enter to send'}
              </span>

              {/* Send, or Stop while an answer is loading */}
              {isBusy && onStop ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-[#1C1D1B] text-white hover:bg-[#3A3B38] cursor-pointer shadow-xs transition-all"
                  title="Stop generating"
                  aria-label="Stop generating"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isDisabled || isBusy || !inputText.trim()}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    inputText.trim() && !isBusy && !isDisabled
                      ? 'bg-[#8A3E00] text-white hover:bg-[#723200] cursor-pointer shadow-xs'
                      : 'bg-[#8A3E00] text-white cursor-not-allowed opacity-60'
                  }`}
                  title="Send question"
                  aria-label="Send question"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.4]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[10.5px] font-mono text-[#656860] text-center pt-0.5 px-2">
          <Info className="w-3 h-3 text-[#656860] shrink-0" />
          <span className="truncate sm:whitespace-normal">
            Answers come only from your documents but can still be wrong. Check the cited sources.
          </span>
        </div>
      </form>
    </div>
  );
};
