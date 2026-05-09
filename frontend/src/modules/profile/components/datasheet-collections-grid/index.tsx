import { CollectionEntry } from '../../types/profile-types';
import DatasheetCollectionListCard from '../../../datasheet/components/collection-list-card';
import { useRouter } from '../../../core/hooks/useRouter';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const DatasheetCollectionsGrid = forwardRef(
  (
    {
      collections,
      selector = false,
    }: {
      collections: CollectionEntry[];
      selector?: boolean;
    },
    ref
  ) => {
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({ selectedCollection }));

    function handleSelect(collectionId: string) {
      setSelectedCollection(collectionId);
    }

    const router = useRouter();

    return (
      <div className="w-full flex justify-center">
        {collections && collections.length > 0 ? (
          <div className="grid grid-cols-3 gap-10">
            {collections.map((collection: CollectionEntry) => (
              <DatasheetCollectionListCard
                key={uuidv4()}
                collection={collection}
                selected={selector ? selectedCollection === collection.id : false}
                handleCustomClick={selector ? () => handleSelect(collection.id) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center justify-center">
            <p className="text-sm mb-2">You have no datasheet collections</p>
            <button
              className="px-4 py-2 bg-sphere-primary-300 text-white rounded hover:bg-sphere-primary-400 transition-colors"
              onClick={() => router.push('/datasheets/collections/new')}
            >
              Create one!
            </button>
          </div>
        )}
      </div>
    );
  }
);

export default DatasheetCollectionsGrid;
