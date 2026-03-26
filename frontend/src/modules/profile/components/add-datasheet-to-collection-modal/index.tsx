import { Button, Modal, Paper } from '@mui/material';
import { CollectionEntry } from '../../types/profile-types';
import { flex } from '../../../core/theme/css';
import { useRef } from 'react';
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
      .catch(error => {
        console.error(error);
      });
  }

  return (
    <Modal
      open={modalState}
      onClose={handleClose}
      aria-labelledby="modal-import-title"
      aria-describedby="modal-import-description"
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 2000,
          width: '90dvw',
          mx: 'auto',
          mt: 4,
          p: 4,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-50%)',
          borderRadius: '20px',
          ...flex({ direction: 'column' }),
        }}
      >
        <h2>Select a collection to save the datasheet</h2>
        <DatasheetCollectionsGrid collections={collections} selector ref={collectionSelector} />
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleAddDatasheetToCollection}>
          Save
        </Button>
      </Paper>
    </Modal>
  );
}
