import { Box, Typography } from '@mui/material';
import { PricingSearchResultItem } from '../sphere';
import { SphereContextItemInput } from '../types/types';
import PricingVersions from './PricingVersions';
import { grey } from '@mui/material/colors';

interface PricingListProps {
  pricings: PricingSearchResultItem[];
  onContextAdd: (input: SphereContextItemInput) => void;
  onContextRemove: (id: string) => void;
}

function PricingsList({ pricings, onContextAdd, onContextRemove }: PricingListProps) {
  const generateKey = (pricing: PricingSearchResultItem) =>
    `${pricing.owner}-${pricing.name}-${pricing.version}-${pricing.collectionName ?? 'nocollection'}`;

  if (pricings.length === 0) {
    return <Box>No pricings found</Box>;
  }

  return (
    <Box>
      {pricings.map(item => (
        <Box key={generateKey(item)}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="h3">
              {item.collectionName ? item.collectionName + '/' + item.name : item.name}
            </Typography>
            <Typography variant="subtitle2" sx={{fontWeight: 600, color: grey[600]}}>Owned by: {item.owner}</Typography>
          </Box>
          <PricingVersions
            owner={item.owner}
            name={item.name}
            collectionName={item.collectionName}
            onContextAdd={onContextAdd}
            onContextRemove={onContextRemove}
          />
        </Box>
      ))}
    </Box>
  );
}

export default PricingsList;
