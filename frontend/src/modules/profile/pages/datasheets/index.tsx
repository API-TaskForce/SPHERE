import { useState } from 'react';
import ProfileSidebar from '../../components/sidebar';
import DatasheetCollectionSection from '../../components/datasheet-collection-section';
import DatasheetSection from '../../components/datasheet-section';

const SIDEBAR_WIDTH = 400;

export default function MyDatasheetsPage() {
  const [addDatasheetToCollectionModalOpen, setAddDatasheetToCollectionModalOpen] = useState(false);
  const [datasheetToAdd, setDatasheetToAdd] = useState('');
  const [renderFlag, setRenderFlag] = useState(false);

  return (
    <div className="flex h-full w-[95vw] max-w-[1300px]">
      <div style={{ width: SIDEBAR_WIDTH + 100 }} className="border-r border-[#ddd]">
        <ProfileSidebar sidebarWidth={SIDEBAR_WIDTH} />
      </div>

      <div className="flex-1 p-2">
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
      </div>
    </div>
  );
}
