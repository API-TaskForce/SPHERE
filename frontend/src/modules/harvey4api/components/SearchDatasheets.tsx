import { ChangeEvent, useState } from 'react';
import { useDatasheets } from '../hooks/useDatasheets';
import type { SphereContextItemInput } from '../../harvey/types/types';
import DatasheetList from './DatasheetList';

interface Props {
  onContextAdd: (input: SphereContextItemInput) => void;
  onContextRemove: (id: string) => void;
}

function SearchDatasheets({ onContextAdd, onContextRemove }: Props) {
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const { loading, error, datasheets: result } = useDatasheets(search, offset, limit);

  const currentPage = offset / limit + 1;
  const totalPages = Math.ceil(result.total / limit);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.currentTarget.value);
    setOffset(0);
  };

  const handlePaginationChange = (page: number) => setOffset((page - 1) * limit);

  if (error) return <div>Something went wrong...</div>;

  const hasResults = result.datasheets.length > 0;

  return (
    <section className="space-y-4">
      <input
        aria-label="Datasheet name"
        placeholder="Datasheet name"
        onChange={handleSearchChange}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      {!loading ? (
        <>
          <span className="inline-flex rounded-full border border-sky-300 px-3 py-1 text-sm text-sky-700">
            {result.total} results
          </span>
          <DatasheetList
            datasheets={result.datasheets}
            onContextAdd={onContextAdd}
            onContextRemove={onContextRemove}
          />
        </>
      ) : (
        <div className="h-[1200px] w-full animate-pulse rounded-2xl bg-slate-100" />
      )}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasResults || currentPage <= 1}
          onClick={() => handlePaginationChange(currentPage - 1)}
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasResults || currentPage >= totalPages}
          onClick={() => handlePaginationChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}

export default SearchDatasheets;
