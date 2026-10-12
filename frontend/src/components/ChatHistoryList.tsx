import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from '../types';
import { relativeTime } from '../chatStore';

interface ChatHistoryListProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Saved chats, newest first. They are stored in this browser only. */
export const ChatHistoryList: React.FC<ChatHistoryListProps> = ({ conversations, activeId, onSelect, onDelete }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between px-0.5">
      <h3 className="text-sm font-bold text-[#1C1D1B] flex items-center gap-1.5">
        <MessageSquare className="w-4 h-4 text-[#C25E00]" />
        Chats
      </h3>
      <span className="text-[10px] font-mono text-[#656860]" title="Chats are saved in this browser only">
        this browser
      </span>
    </div>

    {conversations.length === 0 ? (
      <p className="px-0.5 text-[11px] text-[#656860] leading-snug">Your chats will be saved here.</p>
    ) : (
      conversations.map((c) => {
        const isActive = c.id === activeId;
        return (
          <div
            key={c.id}
            role="button"
            aria-current={isActive}
            onClick={() => onSelect(c.id)}
            className={`group px-2.5 py-2 rounded-lg cursor-pointer flex items-start gap-2 transition-colors ${
              isActive ? 'bg-[#FFFFFF] border border-[#E2E0D8] shadow-2xs' : 'hover:bg-[#EFECE6] border border-transparent'
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className={`text-xs text-[#1C1D1B] line-clamp-2 break-words ${isActive ? 'font-bold' : 'font-medium'}`}>
                {c.title}
              </p>
              <p className="text-[10px] font-mono text-[#656860]">{relativeTime(c.updatedAt)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              className="p-1 rounded text-[#656860] hover:text-[#9D0208] hover:bg-[#FEE2E2] cursor-pointer shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
              title="Delete chat"
              aria-label={`Delete chat: ${c.title}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })
    )}
  </div>
);
