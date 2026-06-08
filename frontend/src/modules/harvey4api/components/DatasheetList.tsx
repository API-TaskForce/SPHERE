import { useState } from 'react';
import type { DatasheetSearchResultItem } from '../hooks/useDatasheets';
import type { SphereDatasheetContextInput } from '../types/types';
import { fetchSphereDatasheetYaml } from '../sphere';

interface Props {
  datasheets: DatasheetSearchResultItem[];
  onContextAdd: (input: SphereDatasheetContextInput) => void;
  onContextRemove: (sphereId: string) => void;
  addedSphereIds: Set<string>;
}

function buildSphereId(item: DatasheetSearchResultItem): string {
  return `${item.owner}/${item.name}/${item.collectionName ?? ''}`;
}

function DatasheetList({ datasheets, onContextAdd, addedSphereIds }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const handleAdd = async (item: DatasheetSearchResultItem) => {
    const sphereId = buildSphereId(item);
    setLoadingId(sphereId);
    setErrorId(null);
    try {
      const { yaml, version, yamlPath } = await fetchSphereDatasheetYaml(
        item.owner,
        item.name,
        item.collectionName
      );
      onContextAdd({
        kind: 'yaml',
        label: `${item.name} (${item.owner})`,
        value: yaml,
        origin: 'sphere',
        sphereId,
        owner: item.owner,
        collection: item.collectionName ?? null,
        datasheetName: item.name,
        version,
        yamlPath,
      });
    } catch (error) {
      console.error('Failed to add SPHERE datasheet', error);
      setErrorId(sphereId);
    } finally {
      setLoadingId(null);
    }
  };

  if (datasheets.length === 0) {
    return <div className="py-4 text-center text-sm text-slate-600">No datasheets found.</div>;
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
      {datasheets.map(item => {
        const sphereId = buildSphereId(item);
        const isAdded = addedSphereIds.has(sphereId);
        return (
          <li key={sphereId} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{item.name}</div>
              <div className="text-xs text-slate-600">
                {item.owner} · {item.version}
                {item.collectionName ? ` · ${item.collectionName}` : ''}
              </div>
              {errorId === sphereId && (
                <div className="mt-1 text-xs text-red-600">Could not load this datasheet.</div>
              )}
            </div>
            {isAdded ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                ✓ Added
              </span>
            ) : (
              <button
                type="button"
                disabled={loadingId === sphereId}
                onClick={() => handleAdd(item)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingId === sphereId ? 'Adding...' : 'Add'}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default DatasheetList;
