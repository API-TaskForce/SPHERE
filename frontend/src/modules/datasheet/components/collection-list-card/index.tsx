import { FaFolder } from 'react-icons/fa';
import { useRouter } from '../../../core/hooks/useRouter';

type DatasheetCollectionEntry = {
  id: string;
  name: string;
  owner: {
    id: string;
    username: string;
    avatar: string;
  };
  numberOfDatasheets?: number;
  numberOfPricings?: number;
};

export default function DatasheetCollectionListCard({
  collection,
  selected = false,
  handleCustomClick,
}: {
  collection: DatasheetCollectionEntry;
  selected?: boolean;
  handleCustomClick?: () => void;
}) {
  const router = useRouter();
  const itemsCount = collection.numberOfDatasheets ?? collection.numberOfPricings ?? 0;

  return (
    <div
      className={`flex flex-col items-center justify-center w-[220px] p-4 rounded-lg cursor-pointer border transition-colors ${
        selected ? 'border-[#48cae4] border-2' : 'border-[#ddd] border'
      }`}
      onClick={
        handleCustomClick
          ? handleCustomClick
          : () => router.push(`/datasheets/collections/${collection.owner.id}/${collection.name}`)
      }
    >
      <FaFolder size={100} />
      <p className="text-base font-medium mt-2">{collection.name}</p>
      <p className="text-sm text-[#637381]">{itemsCount} datasheets</p>
    </div>
  );
}
