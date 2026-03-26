import { Box, Card, CardContent, Menu, MenuItem, Stack, Typography, styled } from '@mui/material';
import { useRouter } from '../../../core/hooks/useRouter';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { IoMdPricetags } from 'react-icons/io';
import { FaFileInvoiceDollar } from 'react-icons/fa6';
import { MdMoreVert } from 'react-icons/md';
import { grey, primary } from '../../../core/theme/palette';
import { getCurrency } from '../../../pricing/components/stats';
import { useState } from 'react';
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
  const [anchorEl, setAnchorEl] = useState(null);
  const { removeDatasheetFromCollection, removeDatasheetByName } = useDatasheetsApi();

  const handleAddToCollection = () => {
    setAddToCollectionModalOpen ? setAddToCollectionModalOpen(true) : null;
    setDatasheetToAdd(name);
  };

  const handleRemoveFromCollection = () => {
    customConfirm('Are you sure you want to remove this datasheet from the collection?').then(() => {
      removeDatasheetFromCollection(name)
        .then(() => {
          customAlert('Datasheet removed from collection');
          window.location.reload();
        })
        .catch(error => {
          console.error(error);
          customAlert('An error occurred while removing the datasheet from the collection');
        });
    });
  };

  const handleRemoveDatasheet = () => {
    removeDatasheetByName(name, dataEntry.collectionName)
      .then(() => {
        customAlert('Datasheet removed');
        window.location.reload();
      })
      .catch(error => {
        console.error(error);
        customAlert('An error occurred while removing the datasheet');
      });
  };

  const handleOpenOptionsMenu = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseOptionsMenu = () => {
    setAnchorEl(null);
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
    try {
      updatedText = `${formatDistanceToNow(parseISO(extractionDate))} ago`;
    } catch {
      updatedText = 'recently';
    }
  }

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
      {showOptions && (
        <>
          <Box
            sx={{
              position: 'absolute',
              right: 10,
              top: 10,
              height: 40,
              width: 40,
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'background-color 0.3s',
              '&:hover': {
                cursor: 'pointer',
                backgroundColor: `${grey[300]}`,
              },
            }}
            onClick={handleOpenOptionsMenu}
          >
            <MdMoreVert fontSize={30} />
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseOptionsMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {setAddToCollectionModalOpen ? (
              <MenuItem
                onClick={handleAddToCollection}
                sx={{
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    backgroundColor: `${grey[300]}`,
                  },
                }}
              >
                <Typography textAlign="center">Add to collection</Typography>
              </MenuItem>
            ) : (
              <MenuItem
                onClick={handleRemoveFromCollection}
                sx={{
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    backgroundColor: `${grey[300]}`,
                  },
                }}
              >
                <Typography textAlign="center" color="red">
                  Remove from collection
                </Typography>
              </MenuItem>
            )}
            <MenuItem
              onClick={handleRemoveDatasheet}
              sx={{
                transition: 'background-color 0.3s',
                '&:hover': {
                  backgroundColor: `${grey[300]}`,
                },
              }}
            >
              <Typography textAlign="center" color="red">
                Remove
              </Typography>
            </MenuItem>
          </Menu>
        </>
      )}
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
            {updatedText}
          </Box>
          <StatsDivider />
          <Box display="flex" justifyContent="center" alignItems="center">
            <FaFileInvoiceDollar
              fill={grey[700]}
              style={{ height: 18, width: 18, marginRight: 10 }}
            />
            <Typography variant="body1">
              {hasSubscriptions ? <>{dataEntry.analytics!.configurationSpaceSize} subscriptions</> : <>–</>}
            </Typography>
          </Box>
          <StatsDivider />
          <Box display="flex" justifyContent="between" alignItems="center">
            <IoMdPricetags fill={grey[700]} style={{ height: 20, width: 20, marginRight: 10 }} />
            <Typography variant="body1">
              {hasPriceRange ? (
                <>
                  {dataEntry.analytics!.minSubscriptionPrice}
                  {getCurrency(dataEntry.currency)} - {dataEntry.analytics!.maxSubscriptionPrice}
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
