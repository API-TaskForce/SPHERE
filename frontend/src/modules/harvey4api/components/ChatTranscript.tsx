import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { ChatMessage, PromptPreset } from '../types/types';
import ChartModal from './ChartModal';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  generatingChartIds?: Set<string>;
  onGenerateChart?: (messageId: string) => void;
  promptPresets?: PromptPreset[];
  onPresetSelect?: (preset: PromptPreset) => void;
}

function ChatTranscript({
  messages,
  isLoading,
  generatingChartIds,
  onGenerateChart,
  promptPresets = [],
  onPresetSelect,
}: Props) {
  const [activeChart, setActiveChart] = useState<string | null>(null);
  const [dismissedCharts, setDismissedCharts] = useState<Set<string>>(new Set());

  const dismissChart = (id: string) => setDismissedCharts(prev => new Set(prev).add(id));

  const isPresetGalleryEnabled = promptPresets.length > 0 && onPresetSelect;

  const renderChartArea = (message: ChatMessage) => {
    if (message.chartHtml) {
      return (
        <button
          type="button"
          onClick={() => setActiveChart(message.chartHtml!)}
          className="mt-2 inline-flex items-center gap-1 rounded-md border border-sphere-primary-300 bg-sphere-primary-50 px-3 py-1.5 text-sm font-medium text-sphere-primary-700 hover:bg-sphere-primary-100"
        >
          📊 Ver gráfica
        </button>
      );
    }

    if (generatingChartIds?.has(message.id)) {
      return (
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sphere-primary-500" />
          <span>Generando gráfica...</span>
        </div>
      );
    }

    if (message.chartError) {
      return (
        <div className="mt-2 text-sm text-red-600">
          No se pudo generar una gráfica para esta respuesta.
        </div>
      );
    }

    if (message.chartAvailable && !dismissedCharts.has(message.id)) {
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-sphere-primary-200 bg-sphere-primary-50 px-3 py-2 text-sm">
          <span className="text-slate-700">
            📊 Para esta respuesta puedo generar una gráfica. ¿Quieres que la genere?
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onGenerateChart?.(message.id)}
              className="rounded-md bg-sphere-primary-500 px-3 py-1 text-sm font-medium text-white hover:bg-sphere-primary-700"
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => dismissChart(message.id)}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
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
    <div className="h-full overflow-y-auto p-2" aria-live="polite" aria-busy={isLoading}>
      {activeChart ? <ChartModal html={activeChart} onClose={() => setActiveChart(null)} /> : null}
      {messages.length === 0 && !isLoading ? (
        <div className="mt-8 text-center">
          <div className="mb-4">
            <p className="mb-2 text-5xl">🤖</p>
            <h2 className="mb-2 text-3xl font-semibold text-slate-800">Welcome to HARVEY4API</h2>
            <p className="text-slate-600">
              Ask questions about APIs and their datasheets, grounded on the SPHERE repository.
            </p>
          </div>
          {isPresetGalleryEnabled && (
            <div className="mx-auto flex max-w-[600px] flex-col gap-2">
              {promptPresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => onPresetSelect(preset)}
                  className="rounded-md border border-slate-300 p-4 text-left normal-case hover:border-sphere-primary-500 hover:bg-sphere-primary-100"
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
      {messages.map(message => (
        <div
          key={message.id}
          className={`mb-2 rounded-md p-4 ${message.role === 'user' ? 'bg-sphere-primary-100 border-l-4 border-sphere-primary-500' : 'bg-slate-100 border-l-4 border-slate-500'}`}
        >
          <div className="mb-1 flex justify-between">
            <span className="text-sm font-semibold text-slate-800">
              {message.role === 'user' ? 'You' : 'HARVEY4API'}
            </span>
            <span className="text-xs text-slate-600">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <div className="prose max-w-none [&_p]:mb-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-slate-200 [&_pre]:p-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
          {renderChartArea(message)}
        </div>
      ))}
      {isLoading ? (
        <div className="flex items-center gap-2 p-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-sphere-primary-500" />
          <span>Processing request...</span>
        </div>
      ) : null}
    </div>
  );
}

export default ChatTranscript;
