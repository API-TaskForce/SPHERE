import { Container } from '@mui/material';
import { useState } from 'react';
import LoadingModal from '../../../core/components/loading-modal';
import CreateDatasheetCollectionForm from '../../components/create-datasheet-collection-form';

export default function CreateDatasheetCollectionPage() {
  const [showLoading, setShowLoading] = useState(false);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <CreateDatasheetCollectionForm setShowLoading={setShowLoading} />
      <LoadingModal showLoading={showLoading} />
    </Container>
  );
}
