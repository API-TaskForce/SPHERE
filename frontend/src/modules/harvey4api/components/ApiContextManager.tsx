import type { PricingContextItem } from '../../harvey/types/types';
import ApiContextManagerItem from './ApiContextManagerItem';

interface Props {
  items: PricingContextItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

function ApiContextManager({ items, onRemove, onClear }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">API Context</h2>
          <p className="text-sm text-slate-600">
            Add API datasheets to ground H.A.R.V.E.Y.'s answers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-600">{items.length} selected</div>
          {items.length > 0 && (
            <button
              type="button"
              className="rounded-md border border-red-500 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500 hover:text-white"
              onClick={onClear}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-4 text-center text-sm text-slate-600">
          No datasheets selected. Add one to keep the conversation grounded.
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {items.map(item => (
            <ApiContextManagerItem key={item.id} item={item} onRemove={onRemove} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default ApiContextManager;
