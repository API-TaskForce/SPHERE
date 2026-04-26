import { ChangeEvent, FormEvent, useState } from 'react';
import ApiContextManager from './ApiContextManager';
import SearchDatasheets from './SearchDatasheets';
import type { ContextInputType, PricingContextItem, PromptPreset, SphereContextItemInput } from '../../harvey/types/types';

interface Props {
  question: string;
  contextItems: PricingContextItem[];
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  onPresetSelect: (preset: PromptPreset) => void;
  onQuestionChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onFileSelect: (files: FileList | null) => void;
  onContextAdd: (input: ContextInputType) => void;
  onContextRemove: (id: string) => void;
  onSphereContextRemove: (sphereId: string) => void;
  onContextClear: () => void;
}

function ApiControlPanel({
  question,
  contextItems,
  isSubmitting,
  isSubmitDisabled,
  onQuestionChange,
  onSubmit,
  onFileSelect,
  onContextAdd,
  onContextRemove,
  onSphereContextRemove,
  onContextClear,
}: Props) {
  const [showDatasheetModal, setDatasheetModal] = useState(false);

  const handleQuestionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onQuestionChange(event.target.value);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <label className="space-y-2">
        <span className="text-sm font-medium">Question</span>
        <textarea
          name="question"
          required
          value={question}
          onChange={handleQuestionChange}
          placeholder="Which API plan best fits a team processing 500K requests per month?"
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? 'Processing...' : 'Ask'}
        </button>
      </div>

      <ApiContextManager
        items={contextItems}
        onRemove={onContextRemove}
        onClear={onContextClear}
      />

      <h2 className="mb-2 text-lg font-semibold text-slate-800">API Context</h2>

      <div className="grid gap-4 lg:grid-cols-2 lg:divide-x lg:divide-slate-200">
        <section className="space-y-3 lg:pr-4">
          <label className="block">
            <span className="inline-flex w-full cursor-pointer justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Select archives
              <input
                type="file"
                multiple
                hidden
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  onFileSelect(event.target.files ?? null);
                }}
              />
            </span>
          </label>
          <h3 className="text-lg font-semibold text-slate-800">Upload datasheet (optional)</h3>
          <p className="text-sm text-slate-700">
            Uploaded datasheets appear in the API context above so you can remove them at any time.
          </p>
        </section>

        <section className="space-y-3 lg:pl-4">
          <button
            type="button"
            onClick={() => setDatasheetModal(true)}
            className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Search datasheets
          </button>
          <h3 className="text-lg font-semibold text-slate-800">Add SPHERE Datasheet (optional)</h3>
          <p className="text-sm text-slate-700">
            Add datasheets from the SPHERE repository to ground your API questions.
          </p>
          <p className="text-sm text-slate-700">
            You can filter results by typing a datasheet name in the search bar.
          </p>

          {showDatasheetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
              <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Search Datasheets</h3>
                  <button
                    type="button"
                    onClick={() => setDatasheetModal(false)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
                <SearchDatasheets
                  onContextAdd={onContextAdd as (input: SphereContextItemInput) => void}
                  onContextRemove={onSphereContextRemove}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </form>
  );
}

export default ApiControlPanel;
