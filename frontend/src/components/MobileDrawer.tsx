import React, { useState } from 'react';
import {
  X,
  FileText,
  MessageSquare,
  Folder,
  BookOpen,
  LineChart,
  Settings,
  ShieldCheck,
  Layers,
  Plus,
  Check
} from 'lucide-react';
import { NavTab, DocumentItem } from '../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  documents: DocumentItem[];
  activeDocName: string;
  onSelectDocument: (name: string) => void;
  onOpenSettings: () => void;
  onAddDocument: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  documents,
  activeDocName,
  onSelectDocument,
  onOpenSettings,
  onAddDocument,
}) => {
  const [activeSection, setActiveSection] = useState<'corpus' | 'nav'>('corpus');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Slide-over Drawer Panel */}
      <div className="relative w-4/5 max-w-xs bg-[#F8F6F0] border-r border-[#E2E0D8] shadow-2xl h-full flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-200 select-none overflow-y-auto">
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E0D8]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#FAF0E6] border border-[#F0D5BE] flex items-center justify-center text-[#C25E00]">
                <FileText className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-bold text-base tracking-tight text-[#1C1D1B]">
                AskMyDocs
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#656860] hover:text-[#1C1D1B] hover:bg-[#EFECE6]"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#EFEAE1] rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveSection('corpus')}
              className={`py-1 rounded-md transition-colors ${
                activeSection === 'corpus'
                  ? 'bg-white text-[#1C1D1B] font-bold shadow-2xs'
                  : 'text-[#656860]'
              }`}
            >
              Target Corpus
            </button>
            <button
              onClick={() => setActiveSection('nav')}
              className={`py-1 rounded-md transition-colors ${
                activeSection === 'nav'
                  ? 'bg-white text-[#1C1D1B] font-bold shadow-2xs'
                  : 'text-[#656860]'
              }`}
            >
              Navigation
            </button>
          </div>

          {/* Section 1: Target Corpus */}
          {activeSection === 'corpus' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#1C1D1B]">
                <span className="font-mono text-[11px] text-[#656860] uppercase">
                  ACTIVE DOCUMENTS ({documents.length})
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#E5EFE8] text-[#1E5631]">
                  Vector v2
                </span>
              </div>

              <div className="space-y-2">
                {documents.map((doc) => {
                  const isActive = doc.name === activeDocName;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        onSelectDocument(doc.name);
                        onClose();
                      }}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white border-l-3 border-l-[#C25E00] border-y border-r border-[#E2E0D8] shadow-2xs'
                          : 'bg-[#F8F6F0] hover:bg-white border-[#E2E0D8]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#C25E00]' : 'text-[#656860]'}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1C1D1B] truncate">{doc.name}</p>
                            <p className="text-[10px] font-mono text-[#656860]">{doc.sizeFormatted} • {doc.date}</p>
                          </div>
                        </div>
                        {isActive ? (
                          <span className="w-2 h-2 rounded-full bg-[#C25E00] shrink-0"></span>
                        ) : (
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    onAddDocument();
                    onClose();
                  }}
                  className="w-full py-2 bg-[#EFEAE1] hover:bg-[#EAE4D8] border border-[#E2E0D8] rounded-lg text-xs font-bold text-[#1C1D1B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Document</span>
                </button>
              </div>

              {/* Strict Grounding Mobile Pill */}
              <div className="p-3 bg-white rounded-xl border border-[#E2E0D8] space-y-1.5">
                <div className="flex items-center gap-1 text-xs font-bold text-[#1C1D1B]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C25E00]" />
                  <span>Strict Grounding</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span>Confidence: <strong className="text-[#1C1D1B]">99.8%</strong></span>
                  <span>Risk: <strong className="text-emerald-700">0%</strong></span>
                </div>
              </div>
            </div>
          ) : (
            /* Section 2: Workspace Navigation */
            <nav className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('research-chat');
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                  activeTab === 'research-chat'
                    ? 'bg-[#C25E00] text-white'
                    : 'text-[#1C1D1B] hover:bg-[#EFECE6]'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Research Chat</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('document-corpus');
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                  activeTab === 'document-corpus'
                    ? 'bg-[#C25E00] text-white'
                    : 'text-[#1C1D1B] hover:bg-[#EFECE6]'
                }`}
              >
                <Folder className="w-4 h-4 text-[#656860]" />
                <span>Document Corpus</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('citations-sources');
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                  activeTab === 'citations-sources'
                    ? 'bg-[#C25E00] text-white'
                    : 'text-[#1C1D1B] hover:bg-[#EFECE6]'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#656860]" />
                <span>Citations &amp; Sources</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('analytics-scope');
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                  activeTab === 'analytics-scope'
                    ? 'bg-[#C25E00] text-white'
                    : 'text-[#1C1D1B] hover:bg-[#EFECE6]'
                }`}
              >
                <LineChart className="w-4 h-4 text-[#656860]" />
                <span>Analytics &amp; Scope</span>
              </button>
            </nav>
          )}
        </div>

        {/* Drawer Bottom */}
        <div className="pt-3 border-t border-[#E2E0D8] space-y-2">
          <div className="p-2.5 bg-[#EFECE6] border border-[#E2E0D8] rounded-lg flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-[#1C1D1B]">Corpus Index</p>
              <p className="text-[10.5px] font-mono text-[#656860]">1,816 chunks verified</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>

          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1C1D1B] hover:bg-[#EFECE6] rounded-lg text-left"
          >
            <Settings className="w-4 h-4 text-[#656860]" />
            <span>Workspace Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
