import { FormEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LuBot, LuSend, LuX } from 'react-icons/lu';
import { useHarveyChat } from '../hooks/useHarveyChat';
import type { ChatMessage } from '../types/types';
import ChartModal from './ChartModal';

interface Props {
  datasheetName: string;
  datasheetYaml: string | null;
}

/**
 * Floating HARVEY4API bot for the individual datasheet view. It grounds every
 * answer on the datasheet currently shown on screen, mirroring the per-document
 * chat behaviour of the original Harvey, including on-demand chart generation.
 */
function DatasheetBot({ datasheetName, datasheetYaml }: Props) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [alwaysShowCharts, setAlwaysShowCharts] = useState(false);
  const [activeChart, setActiveChart] = useState<string | null>(null);
  const [dismissedCharts, setDismissedCharts] = useState<Set<string>>(new Set());
  const { messages, isLoading, generatingChartIds, send, generateChart } = useHarveyChat();
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
  }, [messages, isLoading]);

  const isDisabled = isLoading || !question.trim() || !datasheetYaml;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isDisabled || !datasheetYaml) return;
    const trimmed = question.trim();
    setQuestion('');
    await send(trimmed, [datasheetYaml], alwaysShowCharts);
  };

  const dismissChart = (id: string) => setDismissedCharts(prev => new Set(prev).add(id));

  const renderChartArea = (message: ChatMessage) => {
    if (message.chartHtml) {
      return (
        <button
          type="button"
          onClick={() => setActiveChart(message.chartHtml!)}
          className="mt-2 inline-flex items-center gap-1 rounded-md border border-sphere-primary-300 bg-sphere-primary-50 px-2.5 py-1 text-xs font-medium text-sphere-primary-700 hover:bg-sphere-primary-100"
        >
          📊 Ver gráfica
        </button>
      );
    }
    if (generatingChartIds.has(message.id)) {
      return (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-sphere-primary-500" />
          <span>Generando gráfica...</span>
        </div>
      );
    }
    if (message.chartError) {
      return <div className="mt-2 text-xs text-red-600">No se pudo generar una gráfica.</div>;
    }
    if (message.chartAvailable && !dismissedCharts.has(message.id)) {
      return (
        <div className="mt-2 rounded-md border border-sphere-primary-200 bg-sphere-primary-50 px-2.5 py-2 text-xs">
          <span className="text-slate-700">📊 ¿Genero una gráfica para esta respuesta?</span>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => generateChart(message.id)}
              className="rounded-md bg-sphere-primary-500 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-sphere-primary-700"
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => dismissChart(message.id)}
              className="rounded-md border border-slate-300 px-2.5 py-0.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              No
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {activeChart ? <ChartModal html={activeChart} onClose={() => setActiveChart(null)} /> : null}
      {!open && (
        <button
          type="button"
          aria-label="Ask HARVEY4API about this datasheet"
          title="Ask HARVEY4API about this datasheet"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sphere-primary-500 text-white shadow-lg transition hover:bg-sphere-primary-700"
        >
          <LuBot className="h-7 w-7" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[70vh] max-h-[600px] w-[92vw] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-sphere-primary-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <LuBot className="h-5 w-5" />
              <div className="leading-tight">
                <p className="text-sm font-semibold">HARVEY4API</p>
                <p className="truncate text-xs text-white/80">{datasheetName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAlwaysShowCharts(prev => !prev)}
                aria-pressed={alwaysShowCharts}
                title={
                  alwaysShowCharts
                    ? 'Gráficas automáticas. Pulsa para que se te pregunte antes.'
                    : 'Se te preguntará antes de mostrar una gráfica. Pulsa para incluirlas siempre.'
                }
                className={`rounded-md px-2 py-1 text-xs font-medium ${alwaysShowCharts ? 'bg-white/25' : 'bg-white/10'} hover:bg-white/30`}
              >
                📊 {alwaysShowCharts ? 'Siempre' : 'Preguntar'}
              </button>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-white/20"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div ref={transcriptRef} className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
            {messages.length === 0 && !isLoading && (
              <div className="mt-6 text-center text-sm text-slate-600">
                <p className="mb-2 text-4xl">🤖</p>
                <p>Ask anything about this datasheet's plans, limits or API capabilities.</p>
              </div>
            )}
            {messages.map(message => (
              <div
                key={message.id}
                className={`rounded-md p-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-sphere-primary-100 border-l-4 border-sphere-primary-500'
                    : 'bg-slate-100 border-l-4 border-slate-500'
                }`}
              >
                <div className="mb-1 text-xs font-semibold text-slate-700">
                  {message.role === 'user' ? 'You' : 'HARVEY4API'}
                </div>
                <div className="prose prose-sm max-w-none [&_p]:mb-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-slate-200 [&_pre]:p-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
                {renderChartArea(message)}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 p-2 text-sm text-slate-600">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sphere-primary-500" />
                <span>Processing request...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3">
            {!datasheetYaml && (
              <p className="mb-2 text-xs text-amber-700">
                Waiting for the datasheet to finish loading...
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={question}
                onChange={event => setQuestion(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
                placeholder="Ask about this datasheet..."
                rows={2}
                className="min-h-[44px] w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500"
              />
              <button
                type="submit"
                disabled={isDisabled}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sphere-primary-500 text-white hover:bg-sphere-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <LuSend className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default DatasheetBot;
