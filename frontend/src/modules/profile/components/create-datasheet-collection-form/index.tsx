import { useState } from 'react';
import VisibilityOptions from '../../../pricing/components/visibility-options';
import CollectionNameInput from '../collection-name-input';
import CollectionDescriptionInput from '../collection-description-input';
import { useRouter } from '../../../core/hooks/useRouter';
import FileUpload from '../../../core/components/file-upload-input';
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
      createCollection({
        name: collectionName,
        description: collectionDescription,
        private: visibility === 'Private',
        datasheets: selectedDatasheets,
      })
        .then(() => router.push('/me/datasheets'))
        .catch(error => {
          if (error instanceof Error) { customAlert(error.message); return; }
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
        .then(data => { setShowLoading(false); handleBulkSuccess(data); })
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
        .then(() => router.push('/me/datasheets'))
        .catch(() => deleteCollection(collectionName, true).then(() => router.push('/me/datasheets')));
    } else {
      router.push('/me/datasheets');
    }
  }

  return (
    <form className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-center mb-5">
        Create a collection to store your datasheets
      </h2>
      <CollectionNameInput value={collectionName} onChange={setCollectionName} />
      <CollectionDescriptionInput value={collectionDescription} onChange={setCollectionDescription} />
      <VisibilityOptions value={visibility} onChange={setVisibility} />

      {/* Tabs */}
      <div className="border-b border-[#DFE3E8]">
        <div className="flex">
          {['Select unassigned datasheets', 'Upload collection'].map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setTabValue(i)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tabValue === i
                  ? 'border-sphere-primary-600 text-sphere-primary-600'
                  : 'border-transparent text-[#637381] hover:text-[#212B36]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tabValue === 0 ? (
        <>
          <DatasheetSelector value={selectedDatasheets} onChange={setSelectedDatasheets} />
          <div className="flex justify-center">
            <button
              type="button"
              className="bg-sphere-primary-700 text-sphere-grey-100 font-bold text-base px-10 py-4 mt-5 rounded-xl w-[400px] hover:bg-sphere-primary-800 transition-colors"
              onClick={handleSubmit}
            >
              Add Collection
            </button>
          </div>
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
    </form>
  );
}
