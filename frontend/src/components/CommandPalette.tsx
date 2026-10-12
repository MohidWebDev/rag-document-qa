import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, FileText, Upload, X, MessageSquarePlus, Loader2, AlertTriangle } from 'lucide-react';
import { DocumentItem, SourceCitation, hitToCitation, locationLabel, plural } from '../types';
import { api, ApiSearchHit } from '../api';

interface CommandPaletteProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  documents: DocumentItem[];
  onUpload: () => void;
  onNewChat: () => void;
  onOpenDocument: (doc: DocumentItem) => void;
  onOpenPassage: (citation: SourceCitation) => void;
}

interface PaletteItem {
  key: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  run: () => void;
}

type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'done'; query: string; hits: ApiSearchHit[] }
  | { status: 'error'; query: string; message: string };

/**
 * ⌘K / Ctrl+K palette. Typing filters actions and document names; pressing Enter on
 * "Search inside documents" runs a semantic search (GET /search) and lists matching passages.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onOpen,
  onClose,
  documents,
  onUpload,
  onNewChat,
  onOpenDocument,
  onOpenPassage,
}) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const listRef = useRef<HTMLDivElement>(null);

  // Global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onOpen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onOpen, onClose]);

  // Fresh state every time it opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      setSearch({ status: 'idle' });
    }
  }, [isOpen]);

  const runSearch = (q: string) => {
    setSearch({ status: 'loading', query: q });
    api
      .search(q, 8)
      .then((hits) => setSearch({ status: 'done', query: q, hits }))
      .catch((e: unknown) =>
        setSearch({ status: 'error', query: q, message: e instanceof Error ? e.message : 'Search failed.' }),
      );
  };

  const trimmed = query.trim();

  const items = useMemo<PaletteItem[]>(() => {
    const close = (fn: () => void) => () => {
      fn();
      onClose();
    };
    const lower = trimmed.toLowerCase();
    const result: PaletteItem[] = [];

    // Passages from the last search, while the query hasn't changed
    if (search.status === 'done' && search.query === trimmed) {
      search.hits.forEach((hit, i) => {
        const citation = hitToCitation(hit, i);
        const where = locationLabel(citation);
        result.push({
          key: `hit-${hit.chunk_id}`,
          title: `${hit.filename}${where ? ` · ${where}` : ''}`,
          desc: citation.snippet,
          icon: <FileText className="w-4 h-4 text-[#C25E00]" />,
          run: close(() => onOpenPassage(citation)),
        });
      });
    }

    if (trimmed && documents.length > 0 && !((search.status === 'loading' || search.status === 'done') && search.query === trimmed)) {
      result.push({
        key: 'search',
        title: `Search inside documents for “${trimmed}”`,
        desc: 'Finds the passages most similar to your words',
        icon: <Search className="w-4 h-4 text-[#C25E00]" />,
        run: () => runSearch(trimmed),
      });
    }

    const actions: PaletteItem[] = [
      {
        key: 'upload',
        title: 'Upload document',
        desc: 'Add a PDF, Markdown or text file',
        icon: <Upload className="w-4 h-4 text-[#C25E00]" />,
        run: close(onUpload),
      },
      {
        key: 'new-chat',
        title: 'New chat',
        desc: 'Clear the conversation and start over',
        icon: <MessageSquarePlus className="w-4 h-4 text-[#C25E00]" />,
        run: close(onNewChat),
      },
      ...documents.map((doc) => ({
        key: `doc-${doc.id}`,
        title: `Open ${doc.name}`,
        desc: `${plural(doc.chunkCount, 'chunk')} • ${doc.sizeFormatted} • ${doc.date}`,
        icon: <FileText className="w-4 h-4 text-[#656860]" />,
        run: close(() => onOpenDocument(doc)),
      })),
    ];
    result.push(...actions.filter((a) => !lower || a.title.toLowerCase().includes(lower)));
    return result;
    // runSearch only reads state setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed, search, documents, onClose, onUpload, onNewChat, onOpenDocument, onOpenPassage]);

  // Keep the selection on a real item
  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, items.length - 1)));
  }, [items.length]);

  // Keep the selected row visible
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!isOpen) return null;

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => (items.length ? (s + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => (items.length ? (s - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[selected]?.run();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const hitCount = search.status === 'done' && search.query === trimmed ? search.hits.length : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FFFFFF] rounded-xl border border-[#E2E0D8] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search header */}
        <div className="p-3 border-b border-[#E2E0D8] flex items-center gap-2.5">
          <Search className="w-4 h-4 text-[#656860]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Search your documents, or type a command..."
            className="flex-1 bg-transparent text-sm text-[#1C1D1B] placeholder:text-[#656860] focus:outline-hidden font-sans"
          />
          <button onClick={onClose} className="p-1 rounded text-[#656860] hover:text-[#1C1D1B]" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="p-2 max-h-[60vh] overflow-y-auto space-y-1">
          {search.status === 'loading' && search.query === trimmed && (
            <div className="p-3 flex items-center gap-2 text-xs text-[#656860]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching your documents...
            </div>
          )}
          {search.status === 'error' && search.query === trimmed && (
            <div className="p-3 flex items-start gap-2 text-xs text-[#9D0208] bg-[#FEF2F2] rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {search.message}
            </div>
          )}
          {search.status === 'done' && search.query === trimmed && (
            <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#656860]">
              {hitCount ? `${plural(hitCount, 'matching passage')}` : 'No passage is similar enough to these words'}
            </div>
          )}

          {items.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#656860]">Nothing matches “{trimmed}”</div>
          ) : (
            items.map((item, i) => (
              <button
                key={item.key}
                data-index={i}
                onClick={item.run}
                onMouseMove={() => setSelected(i)}
                className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                  i === selected ? 'bg-[#F8F6F0]' : ''
                }`}
              >
                <div className="p-1.5 rounded-md bg-[#FAF0E6] border border-[#F0D5BE] shrink-0 mt-0.5">{item.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium break-words ${i === selected ? 'text-[#C25E00]' : 'text-[#1C1D1B]'}`}>
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#656860] line-clamp-2">{item.desc}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-[#F8F6F0] border-t border-[#E2E0D8] flex items-center justify-between text-[11px] font-mono text-[#656860]">
          <span>↑ ↓ to move · Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};
