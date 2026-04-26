import { FormEvent, useMemo, useState } from 'react';
import ChatTranscript from '../../../harvey/components/ChatTranscript';
import ApiControlPanel from '../../components/ApiControlPanel';
import PlaygroundProvider from '../../../harvey/components/PlaygroundProvider';
import type {
  ChatMessage,
  ChatRequest,
  ContextInputType,
  PricingContextItem,
  PromptPreset,
} from '../../../harvey/types/types';
import { API_PROMPT_PRESETS } from '../../prompts';
import { PricingContext } from '../../../harvey/context/pricingContext';
import {
  chatWithAgent,
  createContextBodyPayload,
  deleteYamlPricing,
  uploadYamlPricing,
} from '../../../harvey/utils';

function Harvey4APIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [contextItems, setContextItems] = useState<PricingContextItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isSubmitDisabled = useMemo(
    () => isLoading || !question.trim(),
    [question, isLoading]
  );

  const createContextItems = (inputs: ContextInputType[]): PricingContextItem[] =>
    inputs
      .map(item => ({ ...item, value: item.value.trim(), id: crypto.randomUUID() }))
      .filter(
        item =>
          !contextItems.some(
            existing => existing.kind === item.kind && existing.value === item.value
          )
      );

  const addContextItems = (inputs: ContextInputType[]) => {
    if (inputs.length === 0) return null;

    const newItems: PricingContextItem[] = createContextItems(inputs);

    const uploadPromises = newItems
      .filter(
        item => item.kind === 'yaml' && item.origin && (item.origin === 'user' || item.origin === 'preset')
      )
      .map(item => uploadYamlPricing(`${item.id}.yaml`, item.value));

    if (uploadPromises.length > 0) {
      Promise.all(uploadPromises).catch(err => console.error('Upload failed', err));
    }

    setContextItems(prev => [...prev, ...newItems]);
    return newItems;
  };

  const addContextItem = (input: ContextInputType) => {
    addContextItems([input]);
  };

  const removeContextItem = (id: string) => {
    const deletePromises = contextItems
      .filter(
        item =>
          item.id === id &&
          item.kind === 'yaml' &&
          item.origin &&
          (item.origin === 'user' || item.origin === 'preset')
      )
      .map(item => deleteYamlPricing(`${item.id}.yaml`));

    if (deletePromises.length > 0) {
      Promise.all(deletePromises).catch(err => console.error('Delete failed', err));
    }

    setContextItems(prev => prev.filter(item => item.id !== id));
  };

  const removeSphereContextItem = (sphereId: string) => {
    setContextItems(prev =>
      prev.filter(
        item => !(item.origin === 'sphere' && 'sphereId' in item && item.sphereId === sphereId)
      )
    );
  };

  const clearContext = () => {
    const storedYamls = contextItems
      .filter(item => item.kind === 'yaml' && item.origin && item.origin !== 'sphere')
      .map(item => deleteYamlPricing(`${item.id}.yaml`));
    Promise.all(storedYamls).catch(() => console.error('Failed to delete yamls'));
    setContextItems([]);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Promise.all(
      Array.from(files).map(file => file.text().then(content => ({ name: file.name, content })))
    )
      .then(results => {
        const inputs: ContextInputType[] = results
          .filter(r => Boolean(r.content.trim()))
          .map(r => ({ kind: 'yaml', label: r.name, value: r.content, origin: 'user' }));

        if (inputs.length > 0) addContextItems(inputs);

        if (inputs.length !== results.length) {
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: 'One or more uploaded files were empty and were skipped.',
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      })
      .catch(() => {
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Could not read the uploaded file. Please try again.',
            createdAt: new Date().toISOString(),
          },
        ]);
      });
  };

  const handlePromptSelect = (preset: PromptPreset) => {
    setQuestion(preset.question);
    if (preset.context.length > 0) {
      addContextItems(
        preset.context.map(entry => ({ kind: 'yaml', label: entry.label, value: entry.value, origin: 'preset' }))
      );
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setQuestion('');
    setContextItems([]);
    setIsLoading(false);
  };

  const getUniqueYamlFiles = () =>
    Array.from(new Set(contextItems.filter(item => item.kind === 'yaml').map(item => item.value)));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const requestBody: ChatRequest = {
        question: trimmedQuestion,
        ...createContextBodyPayload([], getUniqueYamlFiles()),
      };
      const data = await chatWithAgent(requestBody);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer ?? 'No response available.',
        createdAt: new Date().toISOString(),
        metadata: {
          plan: data.plan ?? undefined,
          result: data.result ?? undefined,
        },
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${(error as Error).message}`,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
      setQuestion('');
    }
  };

  return (
    <PlaygroundProvider playground={false}>
    <PricingContext.Provider value={contextItems}>
      <div className="flex h-screen flex-col px-4 py-6 lg:px-6">
        <div className="mb-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="mb-1 text-4xl font-semibold">H.A.R.V.E.Y. API Assistant</h1>
              <p className="max-w-3xl text-sm text-slate-600 md:text-base">
                Ask about API pricing, rate limits, and quota strategies using H.A.R.V.E.Y. grounded
                on your API datasheets.
              </p>
            </div>
            <div className="flex gap-2">
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
              promptPresets={API_PROMPT_PRESETS}
              onPresetSelect={handlePromptSelect}
            />
          </div>
          <div className="min-h-0 overflow-y-auto">
            <ApiControlPanel
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
              onPresetSelect={handlePromptSelect}
            />
          </div>
        </div>
      </div>
    </PricingContext.Provider>
    </PlaygroundProvider>
  );
}

export default Harvey4APIPage;
