import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Minimal hast shapes, enough for the plugin below. */
interface HastText {
  type: 'text';
  value: string;
}
interface HastElement {
  type: 'element';
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastNode[];
}
type HastNode = HastText | HastElement | { type: string; children?: HastNode[] };

const CITATION_RE = /\[(\d+)\]/g;
const SKIP_TAGS = new Set(['code', 'pre']);

/**
 * Rehype plugin: turn "[3]" in answer text into <cite data-n="3"> so it can render as a
 * clickable chip. Text inside code blocks is left alone.
 */
function rehypeCitations() {
  const visit = (node: HastNode) => {
    if (!('children' in node) || !node.children) return;
    if (node.type === 'element' && SKIP_TAGS.has((node as HastElement).tagName)) return;

    const next: HastNode[] = [];
    for (const child of node.children) {
      if (child.type !== 'text') {
        visit(child);
        next.push(child);
        continue;
      }
      const text = (child as HastText).value;
      let last = 0;
      for (const match of text.matchAll(CITATION_RE)) {
        const start = match.index ?? 0;
        if (start > last) next.push({ type: 'text', value: text.slice(last, start) });
        next.push({
          type: 'element',
          tagName: 'cite',
          properties: { dataN: match[1] },
          children: [{ type: 'text', value: match[0] }],
        });
        last = start + match[0].length;
      }
      if (last < text.length) next.push({ type: 'text', value: text.slice(last) });
    }
    node.children = next;
  };
  return (tree: HastNode) => visit(tree);
}

interface AnswerMarkdownProps {
  content: string;
  /** Source numbers that exist for this answer; other [n] stay plain text */
  citationIds: Set<number>;
  onCite: (id: number) => void;
}

/** Renders a model answer as Markdown (lists, tables, code...) with clickable [n] citations. */
export const AnswerMarkdown: React.FC<AnswerMarkdownProps> = ({ content, citationIds, onCite }) => {
  const components: Components = {
    cite: ({ node, children }) => {
      const id = Number((node?.properties as Record<string, unknown> | undefined)?.dataN);
      if (!citationIds.has(id)) return <>{children}</>;
      return (
        <button
          type="button"
          onClick={() => onCite(id)}
          className="inline-flex items-center justify-center font-mono font-bold text-xs text-[#8A4A00] bg-[#FAF3EA] border border-[#8A4A00] px-1.5 rounded hover:bg-[#8A4A00] hover:text-white transition-colors cursor-pointer mx-0.5 shadow-2xs align-baseline not-italic"
          title={`Show source [${id}]`}
        >
          [{id}]
        </button>
      );
    },
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  };

  return (
    <div className="answer-md text-sm text-[#1C1D1B] leading-relaxed break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeCitations]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
