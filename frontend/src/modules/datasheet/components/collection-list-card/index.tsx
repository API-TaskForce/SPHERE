import { Box, Typography } from '@mui/material';
import { FaFolder } from 'react-icons/fa';
import { useRouter } from '../../../core/hooks/useRouter';
import { flex } from '../../../core/theme/css';
import { primary } from '../../../core/theme/palette';

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
    <Box
      sx={{
        border: selected ? `2px solid ${primary[400]}` : '1px solid #ddd',
        borderRadius: 2,
        p: 2,
        ...flex({ direction: 'column' }),
        width: '220px',
        cursor: 'pointer',
      }}
      key={`collection-${collection.name}`}
      onClick={
        handleCustomClick
          ? handleCustomClick
          : () => router.push(`/datasheets/collections/${collection.owner.id}/${collection.name}`)
      }
    >
      <FaFolder fontSize={100} />
      <Typography variant="subtitle1">{collection.name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {itemsCount} datasheets
      </Typography>
    </Box>
  );
}