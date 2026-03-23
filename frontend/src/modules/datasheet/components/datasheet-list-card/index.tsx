import { Box, Card, CardContent, Stack, Typography, styled } from '@mui/material';
import { useRouter } from '../../../core/hooks/useRouter';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { IoMdPricetags } from 'react-icons/io';
import { FaFileInvoiceDollar } from 'react-icons/fa6';
import { grey, primary } from '../../../core/theme/palette';
import { getCurrency } from '../../../pricing/components/stats';

type DatasheetEntry = {
  name: string;
  owner: string;
  collectionName: string;
  extractionDate: string;
  currency: string;
  analytics?: {
    configurationSpaceSize: number;
    minSubscriptionPrice: number;
    maxSubscriptionPrice: number;
  };
};

const CARD_HEIGHT = 150;

const StatsDivider = styled(Box)(() => ({
  height: 5,
  width: 5,
  borderRadius: '50%',
  backgroundColor: '#000000',
  margin: '0 10px',
}));

export default function DatasheetListCard({
  name,
  owner,
  dataEntry,
}: {
  name: string;
  owner: string;
  dataEntry: DatasheetEntry;
}) {
  const router = useRouter();

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: 3,
        padding: '0 5px',
        width: '100%',
        maxWidth: 600,
        height: CARD_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.3s',
        '&:hover': {
          boxShadow: '0 0 10px 2px',
          boxShadowColor: 'primary.700',
          cursor: 'pointer',
        },
      }}
    >
      <CardContent>
        <Stack
          justifyContent="center"
          height={45}
          pl="10px"
          onClick={() =>
            router.push(
              `/datasheets/${owner}/${name}${
                dataEntry.collectionName ? `?collectionName=${dataEntry.collectionName}` : ''
              }`
            )
          }
          sx={{
            transition: 'color 0.3s',
            '&:hover': {
              cursor: 'pointer',
              color: `${primary[600]}`,
            },
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
            {dataEntry.collectionName ? `${dataEntry.collectionName}/${name}` : name}
          </Typography>
        </Stack>
        <Box display="flex" justifyContent="space-evenly" alignItems="center" mt={2}>
          <Box>
            <Typography component="span">Updated </Typography>
            {dataEntry && formatDistanceToNow(parseISO(dataEntry.extractionDate))} ago
          </Box>
          <StatsDivider />
          <Box display="flex" justifyContent="center" alignItems="center">
            <FaFileInvoiceDollar
              fill={grey[700]}
              style={{ height: 18, width: 18, marginRight: 10 }}
            />
            <Typography variant="body1">
              {dataEntry.analytics ? <>{dataEntry.analytics.configurationSpaceSize} subscriptions</> : <>–</>}
            </Typography>
          </Box>
          <StatsDivider />
          <Box display="flex" justifyContent="between" alignItems="center">
            <IoMdPricetags fill={grey[700]} style={{ height: 20, width: 20, marginRight: 10 }} />
            <Typography variant="body1">
              {dataEntry.analytics ? (
                <>
                  {dataEntry.analytics.minSubscriptionPrice}
                  {getCurrency(dataEntry.currency)} - {dataEntry.analytics.maxSubscriptionPrice}
                  {getCurrency(dataEntry.currency)}
                </>
              ) : (
                <>–</>
              )}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
