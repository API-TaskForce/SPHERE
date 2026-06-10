import { DatasheetContextItem } from '../types/types';

interface ContextManagerItemProps {
  item: DatasheetContextItem;
  onRemove: (id: string) => void;
}

function computeOriginLabel(item: DatasheetContextItem): string {
  switch (item.origin) {
    case 'user':
      return 'Manual';
    case 'preset':
      return 'Preset';
    case 'agent':
      return 'Agent';
    case 'sphere':
      return 'SPHERE';
    default:
      return '';
  }
}

function computeContextItemMetadata(item: DatasheetContextItem): string {
  let res = `DATASHEET · ${computeOriginLabel(item)}`;
  if (item.origin === 'sphere') {
    res += ` · ${item.owner} · ${item.version}`;
  }
  return res;
}

function ContextManagerItem({ item, onRemove }: ContextManagerItemProps) {
  const datasheetLink =
    item.origin === 'sphere' ? `/datasheets/${item.owner}/${item.datasheetName}` : null;

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{item.label}</div>
        <div className="text-xs text-slate-600">{computeContextItemMetadata(item)}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-red-500 px-3 py-2 text-sm text-red-600 hover:bg-red-500 hover:text-white"
          onClick={() => onRemove(item.id)}
        >
          Remove
        </button>
        {datasheetLink && (
          <a
            target="_blank"
            href={datasheetLink}
            rel="noreferrer"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Open datasheet
          </a>
        )}
      </div>
    </li>
  );
}

export default ContextManagerItem;
