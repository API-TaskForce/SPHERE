import { useEffect, useState } from 'react';

export default function DatasheetCollectionFilters({
  receivedOwners,
  textFilterValue,
  setFilterValues,
}: {
  receivedOwners: Record<string, number>;
  textFilterValue: string;
  setFilterValues: Function;
}) {
  const [sort, setSort] = useState<string>('asc');
  const [sortBy, setSortBy] = useState<string>('');
  const [owners, setOwners] = useState<Record<string, number>>({});
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);

  const handleOwnerChange = (owner: string) => {
    setSelectedOwners(prev =>
      prev.includes(owner) ? prev.filter(o => o !== owner) : [...prev, owner]
    );
  };

  const handleFilter = () => {
    setFilterValues({ sort, sortBy, owners: selectedOwners.join(',') });
  };

  const handleClear = () => {
    setSortBy('');
    setSelectedOwners([]);
  };

  useEffect(() => {
    if (textFilterValue) setOwners(receivedOwners);
    else { setOwners({}); setSelectedOwners([]); }
  }, [textFilterValue, receivedOwners]);

  return (
    <div className="w-full mt-[50px] p-4">
      <h4 className="text-3xl font-semibold text-center mb-10">Filters</h4>

      <div className="mb-6">
        <label className="block text-sm font-medium text-[#454F5B] mb-1">Sort By</label>
        <select
          className="w-full border border-[#DFE3E8] rounded px-3 py-2 bg-sphere-grey-200 text-[#212B36]"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="">None</option>
          <option value="numberOfPricings">Number of Datasheets</option>
          <option value="configurationSpaceSize">Configuration Space Size</option>
          <option value="numberOfFeatures">Number of Features</option>
          <option value="numberOfPlans">Number of Plans</option>
          <option value="numberOfAddOns">Number of Add-Ons</option>
        </select>
      </div>

      {sortBy !== '' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#454F5B] mb-1">Sort Order</label>
          <select
            className="w-full border border-[#DFE3E8] rounded px-3 py-2 bg-sphere-grey-200 text-[#212B36]"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      )}

      {textFilterValue !== '' && (
        <div className="w-full p-4 max-w-[500px] mx-auto">
          <h6 className="text-lg font-semibold mb-2">Owner</h6>
          {Object.entries(owners).map(([owner, count]) => (
            <label key={owner} className="flex items-center gap-2 mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedOwners.includes(owner)}
                onChange={() => handleOwnerChange(owner)}
                className="accent-sphere-primary-500"
              />
              <span className="text-sm">{`${owner} (${count})`}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-evenly mt-4">
        <button
          className="px-4 py-2 border border-sphere-primary-600 text-sphere-primary-600 rounded hover:bg-sphere-primary-100 transition-colors"
          onClick={handleClear}
        >
          Clear
        </button>
        <button
          className="px-4 py-2 bg-sphere-primary-300 text-white rounded hover:bg-sphere-primary-500 transition-colors"
          onClick={handleFilter}
        >
          Filter
        </button>
      </div>
    </div>
  );
}
