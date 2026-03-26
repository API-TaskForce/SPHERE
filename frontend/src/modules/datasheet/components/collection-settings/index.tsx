import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import VisibilityOptions from '../../../pricing/components/visibility-options';
import customConfirm from '../../../core/utils/custom-confirm';
import customAlert from '../../../core/utils/custom-alert';
import { useRouter } from '../../../core/hooks/useRouter';
import { DangerZone, SettingsPage } from '../../../pricing/components/pricing-settings';
import { useDatasheetCollectionsApi } from '../../../profile/api/datasheetCollectionsApi';

type DatasheetCollection = {
  id: string;
  name: string;
  description?: string;
  private?: boolean;
  owner: {
    id: string;
    username: string;
    avatar: string;
  };
};

export default function DatasheetCollectionSettings({
  collection,
  updateCollectionMethod,
}: {
  collection: DatasheetCollection;
  updateCollectionMethod: (collection: DatasheetCollection) => void;
}) {
  const [visibility, setVisibility] = useState('Public');

  const { updateCollection, deleteCollection, getCollectionByOwnerAndName } = useDatasheetCollectionsApi();
  const router = useRouter();

  async function refreshCollection() {
    try {
      const updated = await getCollectionByOwnerAndName(collection.owner.id, collection.name);
      updateCollectionMethod(updated);
    } catch (error) {
      console.error(error);
    }
  }

  function handleRename() {
    customConfirm(
      `Are you sure you want to change the name of this collection? You'll be redirected to your profile page.`
    ).then(() => {
      const newName = (document.getElementById('datasheetCollectionNameInput') as HTMLInputElement).value;

      updateCollection(collection.name, { name: newName }).then(() => {
        router.push(`/me/datasheets`);
      });
    });
  }

  function handleDescriptionChange() {
    const newDescription = (
      document.getElementById('datasheetCollectionDescriptionInput') as HTMLInputElement
    ).value;

    updateCollection(collection.name, { description: newDescription }).then(() => {
      customAlert('Description updated!');
      refreshCollection();
    });
  }

  function handleVisibilityChange(value: string) {
    customConfirm('Are you sure you want to change the visibility of this collection?')
      .then(() => {
        const collectionUpdateBody = {
          private: value === 'Private',
        };

        updateCollection(collection.name, collectionUpdateBody)
          .then((data: any) => {
            if (data.error) {
              customAlert(`Error: ${data.error}`);
              return;
            }
            updateCollectionMethod(data);
            setVisibility(value);
            customAlert('Datasheet collection visibility updated successfully');
          })
          .catch((error: Error) => {
            customAlert(`Error: ${error.message}`);
          });
      })
      .catch(() => {});
  }

  function handleDeleteCollection() {
    customConfirm(
      'Are you sure you want to delete this collection and preserve its datasheets? This action is irreversible.'
    ).then(() => {
      deleteCollection(collection.name, false)
        .then(() => {
          router.push('/me/datasheets');
        })
        .catch(() => {
          customAlert(
            `An error has occurred while removing the collection. Please, try again later.`
          );
        });
    });
  }

  function handleDeleteCollectionAndDatasheets() {
    customConfirm(
      'Are you sure you want to delete this collection and its datasheets? This action is irreversible.'
    ).then(() => {
      deleteCollection(collection.name, true)
        .then(() => {
          router.push('/me/datasheets');
        })
        .catch(() => {
          customAlert(
            `An error has occurred while removing the collection. Please, try again later.`
          );
        });
    });
  }

  useEffect(() => {
    setVisibility(collection.private ? 'Private' : 'Public');
  }, [collection]);

  return (
    <SettingsPage>
      <Box marginBottom={3}>
        <Typography variant="h5" fontWeight="bold">
          Global Settings
        </Typography>
        <Box marginTop={3} paddingLeft={5} display="flex" alignItems="center" maxWidth={800}>
          <TextField
            defaultValue={collection.name}
            id="datasheetCollectionNameInput"
            variant="outlined"
            size="small"
            fullWidth
            style={{ marginRight: '10px' }}
          />
          <Button variant="outlined" color="primary" onClick={handleRename}>
            Rename
          </Button>
        </Box>
        <Box marginTop={3} paddingLeft={5} display="flex" alignItems="center" maxWidth={800}>
          <TextField
            type="textarea"
            id="datasheetCollectionDescriptionInput"
            placeholder="Description of this collection"
            defaultValue={collection.description}
            fullWidth
            multiline
            rows={5}
            style={{ marginRight: '10px' }}
          />
          <Button variant="outlined" color="primary" onClick={handleDescriptionChange}>
            Change
          </Button>
        </Box>
      </Box>

      <Typography variant="h5" fontWeight="bold" marginBottom={3}>
        Visibility
      </Typography>
      <Box paddingLeft={5}>
        <VisibilityOptions value={visibility} onChange={handleVisibilityChange} />
      </Box>

      <Typography variant="h5" fontWeight="bold" marginTop={3}>
        Danger zone
      </Typography>
      <DangerZone>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <Stack spacing={2} direction={'column'}>
            <Typography variant="h6" fontWeight="bold" marginBottom={2}>
              Delete this collection
            </Typography>
            <Typography variant="body1" marginBottom={2}>
              This action will delete this collection forever, but not its datasheets. Please be
              certain.
            </Typography>
          </Stack>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteCollection}
            sx={{ fontWeight: 'bold', '&:hover': { backgroundColor: 'red', color: 'white' } }}
          >
            Delete collection
          </Button>
        </Box>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <Stack spacing={2} direction={'column'}>
            <Typography variant="h6" fontWeight="bold" marginBottom={2}>
              Delete this collection and its datasheets
            </Typography>
            <Typography variant="body1" marginBottom={2}>
              This action will delete this collection and all datasheets associated with it forever.
              Please be certain.
            </Typography>
          </Stack>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteCollectionAndDatasheets}
            sx={{ fontWeight: 'bold', '&:hover': { backgroundColor: 'red', color: 'white' } }}
          >
            Delete collection and datasheets
          </Button>
        </Box>
      </DangerZone>
    </SettingsPage>
  );
}
