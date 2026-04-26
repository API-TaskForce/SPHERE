import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatWithApiAgent } from '../utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Props {
  datasheetName: string;
  datasheetYamlUrl: string;
}

const MIN_WIDTH = 380;
const MIN_HEIGHT = 400;
const DEFAULT_WIDTH = 520;
const DEFAULT_HEIGHT = 660;

function HarveyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="14" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="14" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="18" x2="14" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="10" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="10" x2="18" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DatasheetChatBubble({ datasheetName, datasheetYamlUrl }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });

  const transcriptRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isResizing = useRef(false);
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0, posX: 0, posY: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const openWithDefaultPosition = () => {
    setPosition({
      x: window.innerWidth - DEFAULT_WIDTH - 24,
      y: window.innerHeight - DEFAULT_HEIGHT - 24,
    });
    setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPosition({ x: -1, y: -1 });
    setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  };

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging.current) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.current.y)),
        });
      }
      if (isResizing.current) {
        const dx = e.clientX - resizeStart.current.mouseX;
        const dy = e.clientY - resizeStart.current.mouseY;
        const newWidth = Math.max(MIN_WIDTH, resizeStart.current.width + dx);
        const newHeight = Math.max(MIN_HEIGHT, resizeStart.current.height + dy);
        setSize({ width: newWidth, height: newHeight });
      }
    },
    [size]
  );

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    isResizing.current = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // ── Resize ────────────────────────────────────────────────────────────────
  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y,
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'se-resize';
  };

  // ── Chat ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      const data = await chatWithApiAgent({
        question: trimmed,
        datasheet_url: datasheetYamlUrl,
      });
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer ?? 'No response available.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${(error as Error).message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
            zIndex: 50,
          }}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          {/* Header — drag handle */}
          <div
            onMouseDown={onDragMouseDown}
            className="flex cursor-grab items-center justify-between gap-2 border-b border-sky-700 bg-sky-600 px-4 py-3 active:cursor-grabbing select-none"
          >
            <div className="flex min-w-0 items-center gap-2">
              <HarveyIcon className="h-5 w-5 shrink-0 text-white" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-none text-white">Harvey4API</p>
                <p className="mt-0.5 truncate text-xs text-sky-100">{datasheetName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => setMessages([])}
                  className="rounded px-2 py-1 text-xs text-sky-100 hover:bg-sky-700"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onMouseDown={e => e.stopPropagation()}
                onClick={handleClose}
                className="rounded p-1 text-sky-100 hover:bg-sky-700"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Context banner */}
          <div className="border-b border-slate-100 bg-sky-50 px-4 py-2">
            <p className="text-xs text-sky-700">
              <span className="font-medium">Datasheet loaded</span> · Ask anything about its API plans, quotas, and rate limits
            </p>
          </div>

          {/* Transcript */}
          <div
            ref={transcriptRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
            aria-live="polite"
          >
            {messages.length === 0 && !isLoading && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <HarveyIcon className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-base font-semibold text-slate-600">Ask about {datasheetName}</p>
                <p className="mt-1 text-sm text-slate-400">
                  e.g. "What is the rate limit for the Starter plan?"
                </p>
                <p className="mt-0.5 text-sm text-slate-400">
                  e.g. "How many requests can I make per minute on Advanced?"
                </p>
              </div>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`rounded-lg p-4 text-sm ${
                  msg.role === 'user'
                    ? 'ml-6 border-l-4 border-sky-500 bg-sky-50'
                    : 'mr-6 border-l-4 border-slate-300 bg-slate-50'
                }`}
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {msg.role === 'user' ? 'You' : 'H.A.R.V.E.Y.'}
                </p>
                <div className="prose prose-sm max-w-none [&_p]:mb-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-slate-200 [&_pre]:p-2 [&_table]:text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 p-2 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
                Processing request...
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as FormEvent);
                }
              }}
              placeholder="Ask about this API datasheet… (Enter to send)"
              rows={3}
              disabled={isLoading}
              className="mb-3 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="w-full rounded-md bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? 'Processing…' : 'Ask Harvey4API'}
            </button>
          </form>

          {/* Resize handle */}
          <div
            onMouseDown={onResizeMouseDown}
            className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
            title="Drag to resize"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4 text-slate-300" fill="currentColor">
              <path d="M11 5h2v2h-2zM7 9h2v2H7zM11 9h2v2h-2zM3 13h2v2H3zM7 13h2v2H7zM11 13h2v2h-2z" />
            </svg>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={isOpen ? handleClose : openWithDefaultPosition}
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 49 }}
        className="flex items-center gap-2 rounded-full border border-sky-700 bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:bg-sky-700 active:scale-95"
        aria-label="Open Harvey4API assistant"
      >
        <HarveyIcon className="h-4 w-4" />
        Harvey4API
      </button>
    </>
  );
}

export default DatasheetChatBubble;
