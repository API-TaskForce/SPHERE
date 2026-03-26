import { Box, Button, Typography } from '@mui/material';
import { CollectionEntry } from '../../types/profile-types';
import DatasheetCollectionListCard from '../../../datasheet/components/collection-list-card';
import { flex } from '../../../core/theme/css';
import { useRouter } from '../../../core/hooks/useRouter';
import { primary } from '../../../core/theme/palette';
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

    useImperativeHandle(ref, () => {
      return {
        selectedCollection,
      };
    });

    function handleSelect(collectionId: string) {
      setSelectedCollection(collectionId);
    }

    const router = useRouter();

    return (
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {collections && collections.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 5,
            }}
          >
            {collections.map((collection: CollectionEntry) => (
              <DatasheetCollectionListCard
                key={uuidv4()}
                collection={collection}
                selected={selector ? selectedCollection === collection.id : false}
                handleCustomClick={selector ? () => handleSelect(collection.id) : undefined}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ marginTop: '20px', ...flex({ direction: 'column' }) }}>
            <Typography variant="body2" gutterBottom>
              You have no datasheet collections
            </Typography>
            <Button
              variant="contained"
              sx={{ backgroundColor: `${primary[300]}` }}
              onClick={() => router.push('/datasheets/collections/new')}
            >
              Create one!
            </Button>
          </Box>
        )}
      </Box>
    );
  }
);

export default DatasheetCollectionsGrid;
