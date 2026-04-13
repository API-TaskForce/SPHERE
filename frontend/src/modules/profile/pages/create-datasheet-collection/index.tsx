import { useState } from 'react';
import LoadingModal from '../../../core/components/loading-modal';
import CreateDatasheetCollectionForm from '../../components/create-datasheet-collection-form';

export default function CreateDatasheetCollectionPage() {
  const [showLoading, setShowLoading] = useState(false);

  return (
    <div className="max-w-[900px] mx-auto mt-4 px-4">
      <CreateDatasheetCollectionForm setShowLoading={setShowLoading} />
      <LoadingModal showLoading={showLoading} />
    </div>
  );
}
