import { useState } from 'react';
import { Box, Button, Tab, Tabs, Typography } from '@mui/material';
import VisibilityOptions from '../../../pricing/components/visibility-options';
import CollectionNameInput from '../collection-name-input';
import CollectionDescriptionInput from '../collection-description-input';
import { useRouter } from '../../../core/hooks/useRouter';
import FileUpload from '../../../core/components/file-upload-input';
import { grey, primary } from '../../../core/theme/palette';
import { flex } from '../../../core/theme/css';
import customAlert from '../../../core/utils/custom-alert';
import customConfirm from '../../../core/utils/custom-confirm';
import DatasheetSelector from '../datasheets-selector';
import { useDatasheetCollectionsApi } from '../../api/datasheetCollectionsApi';

export type CreateDatasheetCollectionFormProps = {
  readonly setShowLoading: (show: boolean) => void;
};

export default function CreateDatasheetCollectionForm({
  setShowLoading,
}: CreateDatasheetCollectionFormProps) {
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [visibility, setVisibility] = useState('Public');
  const [selectedDatasheets, setSelectedDatasheets] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState(0);

  const { createCollection, createBulkCollection, deleteCollection } = useDatasheetCollectionsApi();
  const router = useRouter();

  const handleSubmit = (file?: File | null) => {
    const fileToUpload = file instanceof File ? file : null;

    if (!fileToUpload) {
      const collectionToCreate = {
        name: collectionName,
        description: collectionDescription,
        private: visibility === 'Private',
        datasheets: selectedDatasheets,
      };

      createCollection(collectionToCreate)
        .then(() => {
          router.push('/me/datasheets');
        })
        .catch(error => {
          if (error instanceof Error) {
            customAlert(error.message);
            return;
          }
          alert(error instanceof Error ? error.message : String(error));
        });
    } else {
      const formData = new FormData();

      formData.append('zip', fileToUpload);
      formData.append('collectionData', JSON.stringify({
        name: collectionName,
        description: collectionDescription,
        private: visibility === 'Private',
      }));

      setShowLoading(true);

      createBulkCollection(formData)
        .then(data => {
          setShowLoading(false);
          handleBulkSuccess(data);
        })
        .catch(error => {
          setShowLoading(false);
          if (error instanceof Error && (error as unknown as { status?: number }).status === 409) {
            customAlert(error.message);
            return;
          }
          customAlert(error instanceof Error ? error.message : String(error));
        });
    }
  };

  function handleBulkSuccess(data: { datasheetsWithErrors?: Array<{ name: string; error: string }> }) {
    if (data.datasheetsWithErrors && data.datasheetsWithErrors.length > 0) {
      customConfirm(
        `Some datasheets could not be added to the collection due to errors: ${data.datasheetsWithErrors
          .map((d: { name: string; error: string }) => d.name)
          .join(' | ')}. Do you still want to save the collection and add them again manually?`
      )
        .then(() => {
          router.push('/me/datasheets');
        })
        .catch(() => {
          deleteCollection(collectionName, true).then(() => {
            router.push('/me/datasheets');
          });
        });
    } else {
      router.push('/me/datasheets');
    }
  }

  function handleAddCollectionClick() {
    handleSubmit();
  }

  return (
    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" align="center" marginBottom={5} fontWeight="bold">
        Create a collection to store your datasheets
      </Typography>
      <CollectionNameInput value={collectionName} onChange={setCollectionName} />
      <CollectionDescriptionInput value={collectionDescription} onChange={setCollectionDescription} />
      <VisibilityOptions value={visibility} onChange={setVisibility} />
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Select unassigned datasheets" />
          <Tab label="Upload collection" />
        </Tabs>
      </Box>
      {tabValue === 0 ? (
        <>
          <DatasheetSelector value={selectedDatasheets} onChange={setSelectedDatasheets} />
          <Box sx={{ ...flex({}) }}>
            <Button
              sx={{
                backgroundColor: primary[700],
                color: grey[100],
                fontWeight: 'bold',
                fontSize: 16,
                px: 5,
                py: 2,
                mt: 5,
                borderRadius: 3,
                width: 400,
              }}
              onClick={handleAddCollectionClick}
            >
              Add Collection
            </Button>
          </Box>
        </>
      ) : (
        <FileUpload
          onSubmit={handleSubmit}
          submitButtonText="Add Collection"
          submitButtonWidth={400}
          isDragActiveText="Drop a .zip file containing all the datasheets of the collection"
          isNotDragActiveText="Drag and drop a .zip file containing all the datasheets of the collection"
          accept={{ 'application/zip': ['.zip'] }}
        />
      )}
    </Box>
  );
}
