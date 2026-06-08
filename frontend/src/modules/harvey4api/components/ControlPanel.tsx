import { ChangeEvent, FormEvent, useState } from 'react';
import ContextManager from './ContextManager';
import type {
  DatasheetContextInput,
  DatasheetContextItem,
  SphereDatasheetContextInput,
} from '../types/types';
import SearchDatasheets from './SearchDatasheets';

interface Props {
  question: string;
  contextItems: DatasheetContextItem[];
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  onQuestionChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onFileSelect: (files: FileList | null) => void;
  onContextAdd: (input: DatasheetContextInput) => void;
  onContextRemove: (id: string) => void;
  onSphereContextRemove: (sphereId: string) => void;
  onContextClear: () => void;
}

function ControlPanel({
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
  const [showDatasheetModal, setDatasheetModal] = useState<boolean>(false);

  const handleQuestionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onQuestionChange(event.target.value);
  };

  const handleOpenModal = () => setDatasheetModal(true);
  const handleCloseModal = () => setDatasheetModal(false);

  const handleSphereContextAdd = (input: SphereDatasheetContextInput) => {
    onContextAdd(input);
  };

  const addedSphereIds = new Set(
    contextItems
      .filter(item => item.origin === 'sphere')
      .map(item => (item as { sphereId: string }).sphereId)
  );

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
          placeholder="Which plan of this API offers the highest request rate limit?"
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
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

      <ContextManager
        items={contextItems}
        onRemove={onContextRemove}
        onClear={onContextClear}
      />

      <h2 className="mb-2 text-lg font-semibold text-slate-800">Add API Datasheet Context</h2>

      <div className="grid gap-4 lg:grid-cols-2 lg:divide-x lg:divide-slate-200">
        <section className="space-y-3 lg:pr-4">
          <label className="block">
            <span className="inline-flex w-full cursor-pointer justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Select datasheets
              <input
                type="file"
                accept=".yaml,.yml"
                multiple
                hidden
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const files = event.target.files ?? null;
                  onFileSelect(files);
                }}
              />
            </span>
          </label>
          <h3 className="text-lg font-semibold text-slate-800">Upload datasheet (optional)</h3>
          <p className="text-sm text-slate-700">
            Uploaded datasheets appear in the context above so you can remove them at any time.
          </p>
        </section>

        <section className="space-y-3 lg:pl-4">
          <button
            type="button"
            onClick={handleOpenModal}
            className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Search datasheets
          </button>
          <h3 className="text-lg font-semibold text-slate-800">Add SPHERE datasheet (optional)</h3>
          <p className="text-sm text-slate-700">
            Add datasheets straight from the SPHERE datasheet repository.
          </p>
          <p className="text-sm text-slate-700">
            Type a datasheet name in the search bar to narrow down the results.
          </p>

          {showDatasheetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
              <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Search Datasheets</h3>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
                <SearchDatasheets
                  onContextAdd={handleSphereContextAdd}
                  onContextRemove={onSphereContextRemove}
                  addedSphereIds={addedSphereIds}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </form>
  );
}

export default ControlPanel;
