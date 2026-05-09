import { useRef } from 'react';
import { CollectionEntry } from '../../types/profile-types';
import customAlert from '../../../core/utils/custom-alert';
import { useDatasheetsApi } from '../../../datasheet/api/datasheetsApi';
import DatasheetCollectionsGrid from '../datasheet-collections-grid';

export default function AddDatasheetToCollectionModal({
  datasheetName,
  modalState,
  handleClose,
  collections,
}: {
  datasheetName: string;
  modalState: boolean;
  handleClose: () => void;
  collections: CollectionEntry[];
}) {
  const collectionSelector = useRef(null);
  const { addDatasheetToCollection } = useDatasheetsApi();

  function handleAddDatasheetToCollection() {
    const selectedCollection = (
      collectionSelector.current! as { selectedCollection: string | null }
    ).selectedCollection;

    addDatasheetToCollection(datasheetName, selectedCollection!)
      .then(() => {
        handleClose();
        customAlert(`${datasheetName} added to collection`);
      })
      .catch(error => console.error(error));
  }

  if (!modalState) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-[20px] p-8 w-[90dvw] shadow-xl flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Select a collection to save the datasheet</h2>
        <DatasheetCollectionsGrid collections={collections} selector ref={collectionSelector} />
        <button
          className="mt-4 px-6 py-2 bg-sphere-primary-600 text-white font-semibold rounded hover:bg-sphere-primary-700 transition-colors"
          onClick={handleAddDatasheetToCollection}
        >
          Save
        </button>
      </div>
    </div>
  );
}
