import React from 'react';
import {
  MessageSquare,
  Folder,
  BookOpen,
  LineChart,
  ShieldCheck,
  Settings,
  FileText
} from 'lucide-react';
import { NavTab } from '../types';

interface SidebarRailProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSettings: () => void;
  verifiedChunksCount?: number;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  verifiedChunksCount = 1420,
}) => {
  return (
    <aside className="hidden lg:flex w-[220px] shrink-0 h-screen bg-[#F8F6F0] border-r border-[#E2E0D8] flex-col justify-between p-3 select-none">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Logo / Brand Header */}
        <div className="flex items-center gap-2.5 px-2 pt-2">
          <div className="w-7 h-7 rounded-md bg-[#C25E00]/10 border border-[#C25E00]/30 flex items-center justify-center text-[#C25E00]">
            <FileText className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#1C1D1B]">
            AskMyDocs
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <button
            onClick={() => onTabChange('research-chat')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
              activeTab === 'research-chat'
                ? 'bg-[#C25E00] text-white shadow-xs'
                : 'text-[#1C1D1B] hover:bg-[#EFECE6]'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="truncate">Research Chat</span>
          </button>

          <button
            onClick={() => onTabChange('document-corpus')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
              activeTab === 'document-corpus'
                ? 'bg-[#C25E00] text-white'
                : 'text-[#1C1D1B] hover:bg-[#EFECE6]'
            }`}
          >
            <Folder className="w-4 h-4 shrink-0 text-[#656860]" />
            <span className="truncate">Document Corpus</span>
          </button>

          <button
            onClick={() => onTabChange('citations-sources')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
              activeTab === 'citations-sources'
                ? 'bg-[#C25E00] text-white'
                : 'text-[#1C1D1B] hover:bg-[#EFECE6]'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0 text-[#656860]" />
            <span className="truncate">Citations & Sources</span>
          </button>

          <button
            onClick={() => onTabChange('analytics-scope')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
              activeTab === 'analytics-scope'
                ? 'bg-[#C25E00] text-white'
                : 'text-[#1C1D1B] hover:bg-[#EFECE6]'
            }`}
          >
            <LineChart className="w-4 h-4 shrink-0 text-[#656860]" />
            <span className="truncate">Analytics & Scope</span>
          </button>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-2 pb-1">
        {/* Corpus Index Info Box */}
        <div className="p-3 bg-[#EFECE6] border border-[#E2E0D8] rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#1C1D1B]">Corpus Index</p>
              <p className="text-[11px] font-mono text-[#656860] tabular-nums mt-0.5">
                {verifiedChunksCount.toLocaleString()} chunks verified
              </p>
            </div>
            <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Workspace Settings button */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1C1D1B] hover:bg-[#EFECE6] rounded-lg transition-colors text-left"
        >
          <Settings className="w-4 h-4 text-[#656860]" />
          <span>Workspace Settings</span>
        </button>
      </div>
    </aside>
  );
};
