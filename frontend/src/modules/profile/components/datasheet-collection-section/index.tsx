import { Box, IconButton, Typography } from '@mui/material';
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
    if (!authUser.isAuthenticated) {
      return;
    }
    getLoggedUserCollections()
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        } else if (data.collections) {
          setCollections(data.collections);
        }
      })
      .catch(error => {
        console.error('Cannot GET datasheet collections. Error:', error);
      });
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
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">
              Collections {collections.length > 0 && `(${collections.length})`}
            </Typography>
            <IconButton onClick={toggleSortOrder} size="medium">
              {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUpAlt />}
            </IconButton>
          </Box>
          <IconButton size="large" onClick={handleAddCollection}>
            <IoMdAddCircleOutline />
          </IconButton>
        </Box>

        <DatasheetCollectionsGrid collections={sortedCollections} />
      </Box>
      <AddDatasheetToCollectionModal
        datasheetName={datasheetToAdd}
        modalState={addDatasheetToCollectionModalOpen}
        handleClose={handleAddDatasheetToCollectionModalClose}
        collections={sortedCollections}
      />
    </>
  );
}
