import { FormEvent, useEffect, useMemo, useState } from 'react';
import ChatTranscript from '../../components/ChatTranscript';
import ControlPanel from '../../components/ControlPanel';
import type {
  DatasheetContextInput,
  DatasheetContextItem,
  PromptPreset,
} from '../../types/types';
import { PROMPT_PRESETS } from '../../prompts';
import { DatasheetContext } from '../../context/datasheetContext';
import { uploadDatasheetYaml, deleteDatasheetYaml } from '../../utils';
import { useHarveyChat } from '../../hooks/useHarveyChat';

const initAlwaysCharts = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('harvey4api-always-charts') === 'true';
};

function ApiAssistantPage() {
  const [question, setQuestion] = useState('');
  const [contextItems, setContextItems] = useState<DatasheetContextItem[]>([]);
  const [alwaysShowCharts, setAlwaysShowCharts] = useState<boolean>(() => initAlwaysCharts());
  const { messages, isLoading, generatingChartIds, send, generateChart, reset } = useHarveyChat();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('harvey4api-always-charts', String(alwaysShowCharts));
    }
  }, [alwaysShowCharts]);

  const isSubmitDisabled = useMemo(() => {
    return isLoading || !question.trim();
  }, [question, isLoading]);

  const createContextItems = (inputs: DatasheetContextInput[]): DatasheetContextItem[] =>
    inputs
      .map(item => ({
        ...item,
        value: item.value.trim(),
        id: crypto.randomUUID(),
      }))
      .filter(
        item => !contextItems.some(stateItem => stateItem.value === item.value)
      ) as DatasheetContextItem[];

  const addContextItems = (inputs: DatasheetContextInput[]) => {
    if (inputs.length === 0) {
      return null;
    }

    const newItems = createContextItems(inputs);

    const uploadPromises = newItems
      .filter(item => item.origin === 'user' || item.origin === 'preset')
      .map(item => uploadDatasheetYaml(`${item.id}.yaml`, item.value));

    if (uploadPromises.length > 0) {
      Promise.all(uploadPromises).catch(err => console.error('Upload failed', err));
    }

    setContextItems(previous => [...previous, ...newItems]);
    return newItems;
  };

  const addContextItem = (input: DatasheetContextInput) => {
    addContextItems([input]);
  };

  const removeContextItem = (id: string) => {
    const deletePromises = contextItems
      .filter(item => item.id === id && (item.origin === 'user' || item.origin === 'preset'))
      .map(item => deleteDatasheetYaml(`${item.id}.yaml`));
    if (deletePromises.length > 0) {
      Promise.all(deletePromises).catch(() => console.error('Failed to delete datasheet'));
    }
    setContextItems(previous => previous.filter(item => item.id !== id));
  };

  const removeSphereContextItem = (sphereId: string) => {
    setContextItems(previous =>
      previous.filter(item => !(item.origin === 'sphere' && item.sphereId === sphereId))
    );
  };

  const clearContext = () => {
    const deletePromises = contextItems
      .filter(item => item.origin === 'user' || item.origin === 'preset')
      .map(item => deleteDatasheetYaml(`${item.id}.yaml`));
    if (deletePromises.length > 0) {
      Promise.all(deletePromises).catch(() => console.error('Failed to delete datasheets'));
    }
    setContextItems([]);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const fileArray = Array.from(files);
    Promise.all(
      fileArray.map(file => file.text().then(content => ({ name: file.name, content })))
    )
      .then(results => {
        const inputs: DatasheetContextInput[] = results
          .filter(result => Boolean(result.content.trim()))
          .map(result => ({
            kind: 'yaml',
            label: result.name,
            value: result.content,
            origin: 'user',
          }));

        if (inputs.length > 0) {
          addContextItems(inputs);
        }
      })
      .catch(error => {
        console.error('Failed to read datasheet file', error);
      });
  };

  const handlePromptSelect = (preset: PromptPreset) => {
    setQuestion(preset.question);
    if (preset.context.length > 0) {
      addContextItems(
        preset.context.map(entry => ({
          kind: 'yaml',
          label: entry.label,
          value: entry.value,
          origin: 'preset',
        }))
      );
    }
  };

  const handleNewConversation = () => {
    reset();
    setQuestion('');
    setContextItems([]);
  };

  const getUniqueYamlFiles = () =>
    Array.from(new Set(contextItems.map(item => item.value)));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitDisabled) return;
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    setQuestion('');
    await send(trimmedQuestion, getUniqueYamlFiles(), alwaysShowCharts);
  };

  return (
    <DatasheetContext.Provider value={contextItems}>
      <div className="flex h-screen flex-col px-4 py-6 lg:px-6">
        <div className="mb-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="mb-1 text-4xl font-semibold">HARVEY4API Assistant</h1>
              <p className="max-w-3xl text-sm text-slate-600 md:text-base">
                Ask about APIs, their plans and usage limits using HARVEY4API, grounded on SPHERE
                datasheets.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAlwaysShowCharts(prev => !prev)}
                aria-pressed={alwaysShowCharts}
                title={
                  alwaysShowCharts
                    ? 'Las gráficas se generan y muestran automáticamente. Pulsa para que se te pregunte antes.'
                    : 'Se te preguntará antes de mostrar una gráfica. Pulsa para incluirlas siempre que sea posible.'
                }
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {alwaysShowCharts ? '📊 Gráficas: siempre' : '📊 Gráficas: preguntar'}
              </button>
              <button
                type="button"
                onClick={handleNewConversation}
                disabled={isLoading}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                New conversation
              </button>
            </div>
          </div>
        </div>
        <div className="grid flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <ChatTranscript
              messages={messages}
              isLoading={isLoading}
              generatingChartIds={generatingChartIds}
              onGenerateChart={generateChart}
              promptPresets={PROMPT_PRESETS}
              onPresetSelect={handlePromptSelect}
            />
          </div>
          <div className="min-h-0 overflow-y-auto">
            <ControlPanel
              question={question}
              contextItems={contextItems}
              isSubmitting={isLoading}
              isSubmitDisabled={isSubmitDisabled}
              onQuestionChange={setQuestion}
              onSubmit={handleSubmit}
              onFileSelect={handleFilesSelected}
              onContextAdd={addContextItem}
              onContextRemove={removeContextItem}
              onSphereContextRemove={removeSphereContextItem}
              onContextClear={clearContext}
            />
          </div>
        </div>
      </div>
    </DatasheetContext.Provider>
  );
}

export default ApiAssistantPage;
