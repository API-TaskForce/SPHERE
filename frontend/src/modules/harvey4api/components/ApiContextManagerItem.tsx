import type { PricingContextItem } from '../../harvey/types/types';

interface Props {
  item: PricingContextItem;
  onRemove: (id: string) => void;
}

function computeOriginLabel(item: PricingContextItem): string {
  switch (item.origin) {
    case 'user':
      return 'Manual';
    case 'sphere':
      return 'SPHERE';
    default:
      return '';
  }
}

function computeMetadata(item: PricingContextItem): string {
  let res = `${item.kind.toUpperCase()} · ${computeOriginLabel(item)}`;
  if (item.origin === 'sphere') {
    res += ` · ${item.owner} · ${item.version}`;
  }
  return res;
}

function ApiContextManagerItem({ item, onRemove }: Props) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{item.label}</div>
        <div className="text-xs text-slate-600">{computeMetadata(item)}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-red-500 px-3 py-2 text-sm text-red-600 hover:bg-red-500 hover:text-white"
          onClick={() => onRemove(item.id)}
        >
          Remove
        </button>
      </div>
    </li>
  );
}

export default ApiContextManagerItem;
