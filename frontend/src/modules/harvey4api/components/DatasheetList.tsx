import type { SphereContextItemInput } from '../../harvey/types/types';
import type { DatasheetSearchResultItem } from '../hooks/useDatasheets';
import DatasheetVersions from './DatasheetVersions';

interface Props {
  datasheets: DatasheetSearchResultItem[];
  onContextAdd: (input: SphereContextItemInput) => void;
  onContextRemove: (id: string) => void;
}

function DatasheetList({ datasheets, onContextAdd, onContextRemove }: Props) {
  if (datasheets.length === 0) return <div>No datasheets found</div>;

  return (
    <div className="space-y-4">
      {datasheets.map(item => (
        <div
          key={`${item.owner}-${item.name}-${item.version}-${item.collectionName ?? 'nocollection'}`}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-lg font-semibold">
              {item.collectionName ? `${item.collectionName}/${item.name}` : item.name}
            </h3>
            <div className="text-sm font-semibold text-slate-600">Owned by: {item.owner}</div>
          </div>
          <DatasheetVersions
            owner={item.owner}
            name={item.name}
            collectionName={item.collectionName}
            onContextAdd={onContextAdd}
            onContextRemove={onContextRemove}
          />
        </div>
      ))}
    </div>
  );
}

export default DatasheetList;
