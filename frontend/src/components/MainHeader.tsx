import React, { useState } from 'react';
import {
  FileText,
  ChevronDown,
  Search,
  Radio,
  User,
  Share2,
  RotateCw,
  Check,
  Sparkles
} from 'lucide-react';
import { DocumentItem } from '../types';

interface MainHeaderProps {
  currentScope: string;
  onScopeChange: (scope: string) => void;
  documents: DocumentItem[];
  onOpenCommandPalette: () => void;
  onOpenUserModal?: () => void;
  onRefresh?: () => void;
  onShare?: () => void;
  onToggleMobileDrawer?: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentScope,
  onScopeChange,
  documents,
  onOpenCommandPalette,
  onOpenUserModal,
  onRefresh,
  onShare,
  onToggleMobileDrawer,
}) => {
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);

  return (
    <header className="w-full bg-[#FFFFFF] border-b border-[#E2E0D8] select-none">
      {/* Top Primary Bar */}
      <div className="h-14 px-3 sm:px-6 flex items-center justify-between border-b border-[#E2E0D8]/60">
        {/* Left: Mobile Menu Toggle + Brand Lockup */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {onToggleMobileDrawer && (
            <button
              onClick={onToggleMobileDrawer}
              className="lg:hidden p-1.5 rounded-lg text-[#1C1D1B] hover:bg-[#F8F6F0] transition-colors cursor-pointer"
              aria-label="Open mobile workspace navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="w-7 h-7 rounded-md bg-[#FAF0E6] border border-[#F0D5BE] flex items-center justify-center text-[#C25E00] shrink-0">
            <FileText className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#1C1D1B]">
            AskMyDocs
          </span>
          <span className="hidden sm:inline-block font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-[#F8F6F0] text-[#656860] border border-[#E2E0D8]">
            Academic v2.4
          </span>
        </div>

        {/* Right Status & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Auto-cite Active status */}
          <div className="flex items-center gap-1.5 text-xs text-[#1C1D1B] font-medium">
            <Radio className="w-3.5 h-3.5 text-[#C25E00]" />
            <span className="hidden md:inline">Auto-cite Active</span>
          </div>

          {/* User Avatar */}
          <button
            onClick={onOpenUserModal}
            className="w-8 h-8 rounded-full bg-[#8A3E00] text-white flex items-center justify-center shadow-2xs hover:opacity-90 transition-opacity cursor-pointer ring-2 ring-white font-medium text-xs shrink-0"
            title="User Profile"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subheader Toolbar with horizontal scroll safety */}
      <div className="h-11 px-3 sm:px-6 bg-[#FBF9F5] flex items-center justify-between text-xs text-[#656860] overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Scope Selector */}
          <div className="relative">
            <button
              onClick={() => setScopeDropdownOpen(!scopeDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-[#FFFFFF] border border-[#E2E0D8] rounded-md text-xs text-[#1C1D1B] hover:border-[#C25E00]/50 transition-colors cursor-pointer shadow-2xs"
            >
              <div className="w-3.5 h-3.5 rounded-xs border border-[#1C1D1B] flex items-center justify-center text-[8px] font-mono shrink-0">
                ⛶
              </div>
              <span className="font-medium max-w-[120px] sm:max-w-[180px] truncate">
                {currentScope}
              </span>
              <ChevronDown className="w-3 h-3 text-[#656860] shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {scopeDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-[#FFFFFF] border border-[#E2E0D8] rounded-lg shadow-md py-1 z-30">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-[#656860] border-b border-[#E2E0D8]">
                  Select Query Scope
                </div>
                <button
                  onClick={() => {
                    onScopeChange('All Documents');
                    setScopeDropdownOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#F8F6F0] text-left text-[#1C1D1B]"
                >
                  <span>All Indexed Documents</span>
                  {currentScope === 'All Documents' && (
                    <Check className="w-3.5 h-3.5 text-[#C25E00]" />
                  )}
                </button>
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      onScopeChange(doc.name);
                      setScopeDropdownOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#F8F6F0] text-left text-[#1C1D1B]"
                  >
                    <span className="truncate">{doc.name}</span>
                    {currentScope === doc.name && (
                      <Check className="w-3.5 h-3.5 text-[#C25E00]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Strict Grounding Active Badge */}
          <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-[#E5EFE8] text-[#1E5631] border border-[#C6DEC9] text-[10px] sm:text-[11px] font-medium font-mono shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Strict Grounding</span>
          </div>

          {/* ⌘K SEARCH badge */}
          <button
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#FFFFFF] border border-[#E2E0D8] text-[10.5px] sm:text-[11px] font-mono text-[#656860] hover:text-[#1C1D1B] hover:border-[#C25E00]/40 transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            <Search className="w-3 h-3 text-[#656860] inline md:hidden" />
            <span className="hidden md:inline">⌘ K SEARCH</span>
            <span className="md:hidden">Search</span>
          </button>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1 pl-2 shrink-0">
          <button
            onClick={onShare}
            className="p-1.5 rounded text-[#656860] hover:text-[#1C1D1B] hover:bg-[#EFECE6] transition-colors cursor-pointer"
            title="Share thread"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded text-[#656860] hover:text-[#1C1D1B] hover:bg-[#EFECE6] transition-colors cursor-pointer"
            title="Reset or refresh synthesis"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
