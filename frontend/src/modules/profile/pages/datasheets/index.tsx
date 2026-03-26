import { Box } from '@mui/material';
import ProfileSidebar from '../../components/sidebar';
import { useState } from 'react';
import DatasheetCollectionSection from '../../components/datasheet-collection-section';
import DatasheetSection from '../../components/datasheet-section';

const SIDEBAR_WIDTH = 400;

export default function MyDatasheetsPage() {
  const [addDatasheetToCollectionModalOpen, setAddDatasheetToCollectionModalOpen] = useState(false);
  const [datasheetToAdd, setDatasheetToAdd] = useState('');
  const [renderFlag, setRenderFlag] = useState(false);

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '95vw', maxWidth: '1300px' }}>
      <Box
        sx={{
          width: SIDEBAR_WIDTH + 100,
          borderRight: '1px solid #ddd',
        }}
      >
        <ProfileSidebar sidebarWidth={SIDEBAR_WIDTH} />
      </Box>

      <Box sx={{ flexGrow: 1, p: 2 }}>
        <DatasheetCollectionSection
          datasheetToAdd={datasheetToAdd}
          addDatasheetToCollectionModalOpen={addDatasheetToCollectionModalOpen}
          setAddDatasheetToCollectionModalOpen={setAddDatasheetToCollectionModalOpen}
          renderFlag={renderFlag}
          setRenderFlag={setRenderFlag}
        />
        <DatasheetSection
          setAddToCollectionModalOpen={setAddDatasheetToCollectionModalOpen}
          setDatasheetToAdd={setDatasheetToAdd}
          renderFlag={renderFlag}
        />
      </Box>
    </Box>
  );
}
