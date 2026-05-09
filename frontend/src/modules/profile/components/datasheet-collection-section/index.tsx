import { IoMdAddCircleOutline } from 'react-icons/io';
import { FaSortAlphaDown, FaSortAlphaUpAlt } from 'react-icons/fa';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '../../../core/hooks/useRouter';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useDatasheetCollectionsApi } from '../../api/datasheetCollectionsApi';
import DatasheetCollectionsGrid from '../datasheet-collections-grid';
import AddDatasheetToCollectionModal from '../add-datasheet-to-collection-modal';

export default function DatasheetCollectionSection({
  datasheetToAdd,
  addDatasheetToCollectionModalOpen,
  setAddDatasheetToCollectionModalOpen,
  renderFlag,
  setRenderFlag,
}: {
  datasheetToAdd: string;
  addDatasheetToCollectionModalOpen: boolean;
  setAddDatasheetToCollectionModalOpen: (value: boolean) => void;
  renderFlag: boolean;
  setRenderFlag: (value: boolean) => void;
}) {
  const [collections, setCollections] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { getLoggedUserCollections } = useDatasheetCollectionsApi();
  const { authUser } = useAuth();
  const router = useRouter();

  function handleAddCollection() {
    router.push('/datasheets/collections/new');
  }

  function handleAddDatasheetToCollectionModalClose() {
    setRenderFlag(!renderFlag);
    setAddDatasheetToCollectionModalOpen(false);
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  useEffect(() => {
    if (!authUser.isAuthenticated) return;
    getLoggedUserCollections()
      .then(data => {
        if (data.error) throw new Error(data.error);
        else if (data.collections) setCollections(data.collections);
      })
      .catch(error => console.error('Cannot GET datasheet collections. Error:', error));
  }, [renderFlag, authUser]);

  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [collections, sortOrder]);

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <h6 className="text-lg font-semibold">
              Collections {collections.length > 0 && `(${collections.length})`}
            </h6>
            <button onClick={toggleSortOrder} className="ml-2 p-1 rounded hover:bg-sphere-grey-200">
              {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUpAlt />}
            </button>
          </div>
          <button onClick={handleAddCollection} className="p-2 rounded-full hover:bg-sphere-grey-200 text-2xl">
            <IoMdAddCircleOutline />
          </button>
        </div>

        <DatasheetCollectionsGrid collections={sortedCollections} />
      </div>
      <AddDatasheetToCollectionModal
        datasheetName={datasheetToAdd}
        modalState={addDatasheetToCollectionModalOpen}
        handleClose={handleAddDatasheetToCollectionModalClose}
        collections={sortedCollections}
      />
    </>
  );
}
