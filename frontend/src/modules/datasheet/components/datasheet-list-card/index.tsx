import { useRouter } from '../../../core/hooks/useRouter';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { IoMdPricetags } from 'react-icons/io';
import { FaFileInvoiceDollar } from 'react-icons/fa6';
import { MdMoreVert } from 'react-icons/md';
import { getCurrency } from '../../../pricing/components/stats';
import { useState, useRef, useEffect } from 'react';
import customAlert from '../../../core/utils/custom-alert';
import customConfirm from '../../../core/utils/custom-confirm';
import { useDatasheetsApi } from '../../api/datasheetsApi';

type DatasheetEntry = {
  name: string;
  owner: string;
  collectionName: string;
  extractionDate?: string;
  currency: string;
  analytics?: {
    configurationSpaceSize: number;
    minSubscriptionPrice: number;
    maxSubscriptionPrice: number;
  };
};

const CARD_HEIGHT = 150;

export default function DatasheetListCard({
  name,
  owner,
  dataEntry,
  showOptions = false,
  setDatasheetToAdd = () => {},
  setAddToCollectionModalOpen,
}: {
  name: string;
  owner: string;
  dataEntry: DatasheetEntry;
  showOptions?: boolean;
  setDatasheetToAdd?: (value: string) => void;
  setAddToCollectionModalOpen?: (value: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { removeDatasheetFromCollection, removeDatasheetByName } = useDatasheetsApi();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddToCollection = () => {
    setAddToCollectionModalOpen ? setAddToCollectionModalOpen(true) : null;
    setDatasheetToAdd(name);
    setMenuOpen(false);
  };

  const handleRemoveFromCollection = () => {
    setMenuOpen(false);
    customConfirm('Are you sure you want to remove this datasheet from the collection?').then(() => {
      removeDatasheetFromCollection(name)
        .then(() => { customAlert('Datasheet removed from collection'); window.location.reload(); })
        .catch(error => { console.error(error); customAlert('An error occurred while removing the datasheet from the collection'); });
    });
  };

  const handleRemoveDatasheet = () => {
    setMenuOpen(false);
    removeDatasheetByName(name, dataEntry.collectionName)
      .then(() => { customAlert('Datasheet removed'); window.location.reload(); })
      .catch(error => { console.error(error); customAlert('An error occurred while removing the datasheet'); });
  };

  const router = useRouter();
  const hasSubscriptions = Number.isFinite(dataEntry.analytics?.configurationSpaceSize);
  const hasPriceRange =
    Number.isFinite(dataEntry.analytics?.minSubscriptionPrice) &&
    Number.isFinite(dataEntry.analytics?.maxSubscriptionPrice);
  const extractionDate = dataEntry?.extractionDate;
  const hasValidExtractionDate = typeof extractionDate === 'string' && extractionDate.trim().length > 0;

  let updatedText = 'recently';
  if (hasValidExtractionDate) {
    try { updatedText = `${formatDistanceToNow(parseISO(extractionDate))} ago`; }
    catch { updatedText = 'recently'; }
  }

  return (
    <div
      className="relative rounded-lg shadow-md px-[5px] w-full max-w-[600px] overflow-hidden transition-shadow hover:shadow-[0_0_10px_2px_rgba(0,119,182,0.4)] hover:cursor-pointer"
      style={{ height: CARD_HEIGHT }}
    >
      {showOptions && (
        <div ref={menuRef} className="absolute right-2 top-2">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center transition-colors hover:cursor-pointer hover:bg-sphere-grey-300"
            onClick={() => setMenuOpen(v => !v)}
          >
            <MdMoreVert size={30} />
          </div>
          {menuOpen && (
            <div className="absolute right-0 top-10 bg-white border border-[#DFE3E8] rounded shadow-lg z-10 min-w-[180px]">
              {setAddToCollectionModalOpen ? (
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-sphere-grey-300 transition-colors"
                  onClick={handleAddToCollection}
                >
                  Add to collection
                </button>
              ) : (
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-sphere-grey-300 transition-colors"
                  onClick={handleRemoveFromCollection}
                >
                  Remove from collection
                </button>
              )}
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-sphere-grey-300 transition-colors"
                onClick={handleRemoveDatasheet}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      <div className="px-[10px]">
        <div
          className="flex items-center h-[45px] pl-[10px] transition-colors hover:cursor-pointer hover:text-sphere-primary-600"
          onClick={() =>
            router.push(
              `/datasheets/${owner}/${name}${dataEntry.collectionName ? `?collectionName=${dataEntry.collectionName}` : ''}`
            )
          }
        >
          <h6 className="font-bold mt-1 text-lg">
            {dataEntry.collectionName ? `${dataEntry.collectionName}/${name}` : name}
          </h6>
        </div>

        <div className="flex justify-evenly items-center mt-4">
          <span>
            <span className="text-base">Updated </span>
            {updatedText}
          </span>
          <span className="h-[5px] w-[5px] rounded-full bg-black mx-[10px]" />
          <div className="flex items-center justify-center">
            <FaFileInvoiceDollar fill="#454F5B" style={{ height: 18, width: 18, marginRight: 10 }} />
            <span className="text-base">
              {hasSubscriptions ? <>{dataEntry.analytics!.configurationSpaceSize} subscriptions</> : <>–</>}
            </span>
          </div>
          <span className="h-[5px] w-[5px] rounded-full bg-black mx-[10px]" />
          <div className="flex items-center">
            <IoMdPricetags fill="#454F5B" style={{ height: 20, width: 20, marginRight: 10 }} />
            <span className="text-base">
              {hasPriceRange ? (
                <>
                  {dataEntry.analytics!.minSubscriptionPrice}{getCurrency(dataEntry.currency)} -{' '}
                  {dataEntry.analytics!.maxSubscriptionPrice}{getCurrency(dataEntry.currency)}
                </>
              ) : (
                <>–</>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
