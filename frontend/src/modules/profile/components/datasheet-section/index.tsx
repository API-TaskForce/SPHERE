import { useEffect, useMemo, useState } from 'react';
import { FaSortAlphaDown, FaSortAlphaUpAlt } from 'react-icons/fa';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useDatasheetsApi } from '../../../datasheet/api/datasheetsApi';
import DatasheetListCard from '../../../datasheet/components/datasheet-list-card';

export type ProfileDatasheetEntry = {
  name: string;
  owner: string;
  version: string;
  collectionName: string;
  extractionDate: string;
  currency: string;
  analytics: {
    configurationSpaceSize: number;
    minSubscriptionPrice: number;
    maxSubscriptionPrice: number;
  };
};

export default function DatasheetSection({
  setAddToCollectionModalOpen,
  setDatasheetToAdd,
  renderFlag,
}: {
  setAddToCollectionModalOpen: (value: boolean) => void;
  setDatasheetToAdd: (value: string) => void;
  renderFlag: boolean;
}) {
  const [datasheets, setDatasheets] = useState<ProfileDatasheetEntry[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { getLoggedUserDatasheets } = useDatasheetsApi();
  const { authUser } = useAuth();

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  useEffect(() => {
    if (!authUser.isAuthenticated) return;

    getLoggedUserDatasheets()
      .then(data => {
        if (data.error) throw new Error(data.error);
        else if (data.datasheets?.datasheets) setDatasheets(data.datasheets.datasheets);
        else setDatasheets([]);
      })
      .catch(error => console.error('Cannot GET datasheets. Error:', error));
  }, [renderFlag, authUser]);

  const sortedDatasheets = useMemo(() => {
    return [...datasheets].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [datasheets, sortOrder]);

  return (
    <div>
      {sortedDatasheets.length > 0 && (
        <>
          <div className="flex items-center mb-1">
            <h6 className="text-lg font-semibold">
              Unassigned {sortedDatasheets.length > 0 && `(${sortedDatasheets.length})`}
            </h6>
            <button onClick={toggleSortOrder} className="ml-2 p-1 rounded hover:bg-sphere-grey-200">
              {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUpAlt />}
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 mt-8">
            {sortedDatasheets.map(datasheet => (
              <DatasheetListCard
                name={datasheet.name}
                owner={datasheet.owner}
                dataEntry={datasheet}
                showOptions
                setDatasheetToAdd={setDatasheetToAdd}
                setAddToCollectionModalOpen={setAddToCollectionModalOpen}
                key={`datasheet-${datasheet.name}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
