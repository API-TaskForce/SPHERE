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
  owner: { id: string; username: string; avatar: string };
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
      updateCollection(collection.name, { name: newName }).then(() => router.push(`/me/datasheets`));
    });
  }

  function handleDescriptionChange() {
    const newDescription = (document.getElementById('datasheetCollectionDescriptionInput') as HTMLInputElement).value;
    updateCollection(collection.name, { description: newDescription }).then(() => {
      customAlert('Description updated!');
      refreshCollection();
    });
  }

  function handleVisibilityChange(value: string) {
    customConfirm('Are you sure you want to change the visibility of this collection?')
      .then(() => {
        updateCollection(collection.name, { private: value === 'Private' })
          .then((data: any) => {
            if (data.error) { customAlert(`Error: ${data.error}`); return; }
            updateCollectionMethod(data);
            setVisibility(value);
            customAlert('Datasheet collection visibility updated successfully');
          })
          .catch((error: Error) => customAlert(`Error: ${error.message}`));
      })
      .catch(() => {});
  }

  function handleDeleteCollection() {
    customConfirm(
      'Are you sure you want to delete this collection and preserve its datasheets? This action is irreversible.'
    ).then(() => {
      deleteCollection(collection.name, false)
        .then(() => router.push('/me/datasheets'))
        .catch(() => customAlert(`An error has occurred while removing the collection. Please, try again later.`));
    });
  }

  function handleDeleteCollectionAndDatasheets() {
    customConfirm(
      'Are you sure you want to delete this collection and its datasheets? This action is irreversible.'
    ).then(() => {
      deleteCollection(collection.name, true)
        .then(() => router.push('/me/datasheets'))
        .catch(() => customAlert(`An error has occurred while removing the collection. Please, try again later.`));
    });
  }

  useEffect(() => {
    setVisibility(collection.private ? 'Private' : 'Public');
  }, [collection]);

  return (
    <SettingsPage>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Global Settings</h2>
        <div className="mt-6 pl-10 flex items-center max-w-[800px]">
          <input
            id="datasheetCollectionNameInput"
            defaultValue={collection.name}
            className="border border-[#DFE3E8] rounded px-3 py-2 flex-1 mr-2 text-sm"
          />
          <button
            className="px-4 py-2 border border-sphere-primary-600 text-sphere-primary-600 rounded hover:bg-sphere-primary-100 transition-colors text-sm"
            onClick={handleRename}
          >
            Rename
          </button>
        </div>
        <div className="mt-6 pl-10 flex items-center max-w-[800px]">
          <textarea
            id="datasheetCollectionDescriptionInput"
            placeholder="Description of this collection"
            defaultValue={collection.description}
            rows={5}
            className="border border-[#DFE3E8] rounded px-3 py-2 flex-1 mr-2 text-sm resize-none"
          />
          <button
            className="px-4 py-2 border border-sphere-primary-600 text-sphere-primary-600 rounded hover:bg-sphere-primary-100 transition-colors text-sm"
            onClick={handleDescriptionChange}
          >
            Change
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">Visibility</h2>
      <div className="pl-10">
        <VisibilityOptions value={visibility} onChange={handleVisibilityChange} />
      </div>

      <h2 className="text-2xl font-bold mt-6">Danger zone</h2>
      <DangerZone>
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold">Delete this collection</h3>
            <p className="text-base">
              This action will delete this collection forever, but not its datasheets. Please be certain.
            </p>
          </div>
          <button
            className="px-4 py-2 border border-red-500 text-red-500 rounded font-bold hover:bg-red-500 hover:text-white transition-colors"
            onClick={handleDeleteCollection}
          >
            Delete collection
          </button>
        </div>
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold">Delete this collection and its datasheets</h3>
            <p className="text-base">
              This action will delete this collection and all datasheets associated with it forever. Please be certain.
            </p>
          </div>
          <button
            className="px-4 py-2 border border-red-500 text-red-500 rounded font-bold hover:bg-red-500 hover:text-white transition-colors"
            onClick={handleDeleteCollectionAndDatasheets}
          >
            Delete collection and datasheets
          </button>
        </div>
      </DangerZone>
    </SettingsPage>
  );
}
