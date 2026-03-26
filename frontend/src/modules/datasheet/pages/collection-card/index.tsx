import { Helmet } from 'react-helmet';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { usePathname } from '../../../core/hooks/usePathname';
import { useRouter } from '../../../core/hooks/useRouter';
import { FaSortAlphaDown, FaSortAlphaUpAlt } from 'react-icons/fa';
import { primary } from '../../../core/theme/palette';
import { PricingsGrid } from '../../../pricing/pages/list';
import DatasheetListCard from '../../components/datasheet-list-card';
import { useDatasheetCollectionsApi } from '../../../profile/api/datasheetCollectionsApi';
import { useAuth } from '../../../auth/hooks/useAuth';
import DatasheetCollectionSettings from '../../components/collection-settings';

type DatasheetCollection = {
  id: string;
  name: string;
  description?: string;
  private?: boolean;
  owner: {
    id: string;
    username: string;
    avatar: string;
  };
  analytics?: {
    evolutionOfPlans?: { dates: string[] };
  };
  datasheets?: any[];
  pricings?: Array<{
    datasheets?: any[];
    pricings?: any[];
  }>;
};

export default function DatasheetCollectionCardPage() {
  const [collection, setCollection] = useState<DatasheetCollection | undefined>(undefined);
  const [tabValue, setTabValue] = useState(0);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const lastRequestedCollectionKeyRef = useRef<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { getCollectionByOwnerAndName, downloadCollection } = useDatasheetCollectionsApi();
  const { authUser } = useAuth();

  const isCollectionOwner = useMemo(() => {
    if (!collection || !authUser?.user) {
      return false;
    }

    const sameId =
      collection.owner?.id && authUser.user.id
        ? collection.owner.id === authUser.user.id
        : false;

    const sameUsername =
      collection.owner?.username && authUser.user.username
        ? collection.owner.username.toLowerCase() === authUser.user.username.toLowerCase()
        : false;

    return sameId || sameUsername;
  }, [collection, authUser]);

  useEffect(() => {
    const segments = pathname.split('/');
    const name = segments.pop() as string;
    const ownerId = segments[segments.length - 1];

    const currentCollectionKey = `${ownerId}/${name}`;
    if (lastRequestedCollectionKeyRef.current === currentCollectionKey) {
      return;
    }
    lastRequestedCollectionKeyRef.current = currentCollectionKey;

    getCollectionByOwnerAndName(ownerId, name)
      .then(collectionData => {
        if (collectionData) {
          setCollection(collectionData);
        } else {
          router.push('/error');
        }
      })
      .catch(() => {
        router.push('/error');
      });
  }, [pathname, router, getCollectionByOwnerAndName]);



  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const sortedDatasheets = useMemo(() => {
    if (!collection) {
      return [];
    }

    const datasheetArray =
      Array.isArray(collection.datasheets?.[0]?.datasheets)
        ? (collection.datasheets?.[0]?.datasheets as any[])
        : Array.isArray(collection.datasheets)
        ? collection.datasheets
        : Array.isArray(collection.pricings?.[0]?.datasheets)
        ? (collection.pricings?.[0]?.datasheets as any[])
        : Array.isArray(collection.pricings?.[0]?.pricings)
        ? (collection.pricings?.[0]?.pricings as any[])
        : [];

    return [...datasheetArray].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [collection, sortOrder]);

  return (
    <>
      <Helmet>
        <title>{`SPHERE - ${collection?.name} Datasheet Collection`}</title>
      </Helmet>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" flexDirection="column">
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h5" letterSpacing={1}>
                  {collection?.name}
                </Typography>
              </Box>

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                  <Tab label="Collection card" />
                  {isCollectionOwner && <Tab label="Settings" />}
                </Tabs>
              </Box>
            </Box>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" gap={2}>
                {collection && collection.analytics?.evolutionOfPlans?.dates?.length ? (
                  <>
                    <TextField
                      label="Start Date"
                      type="date"
                      fullWidth
                      defaultValue={
                        new Date(collection.analytics.evolutionOfPlans.dates[0])
                          .toISOString()
                          .split('T')[0]
                      }
                      slotProps={{ inputLabel: { shrink: true } }}
                      disabled
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      fullWidth
                      defaultValue={new Date().toISOString().split('T')[0]}
                      slotProps={{ inputLabel: { shrink: true } }}
                      disabled
                    />
                  </>
                ) : null}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box display="flex" gap={4} sx={{ mb: 4 }}>
          {tabValue === 1 && collection && (
            <DatasheetCollectionSettings
              collection={collection}
              updateCollectionMethod={setCollection}
            />
          )}
          {tabValue === 0 && (
            <Box flex={1}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Description
              </Typography>
              <Typography variant="body1" sx={{ mb: 4 }}>
                {collection?.description || 'This collection has no description.'}
              </Typography>

              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" mb={-2}>
                  <Typography variant="h6" fontWeight="bold">
                    Datasheets in Collection
                  </Typography>
                  <IconButton onClick={toggleSortOrder} size="medium">
                    {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUpAlt />}
                  </IconButton>
                </Box>
                <Button
                  sx={{
                    border: `1px solid ${primary[400]}`,
                    color: `${primary[400]}`,
                    width: 150,
                    height: 40,
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: -2,
                    '&:hover': {
                      backgroundColor: primary[400],
                      color: 'white',
                    },
                  }}
                  onClick={() =>
                    downloadCollection(collection?.owner.id as string, collection?.name as string)
                  }
                >
                  DOWNLOAD
                </Button>
              </Box>

              <PricingsGrid
                sx={{
                  height: '100%',
                  maxHeight: 800,
                  overflowY: 'scroll',
                  border: '1px solid #e0e0e0',
                  borderRadius: '10px',
                  padding: '20px 0',
                }}
              >
                {sortedDatasheets.length > 0 ? (
                  sortedDatasheets.map((datasheet: any) => {
                    const ownerName =
                      typeof datasheet.owner === 'string'
                        ? datasheet.owner
                        : datasheet.owner?.username || '';

                    return (
                      <DatasheetListCard
                        key={`${ownerName}-${datasheet.name}`}
                        name={datasheet.name}
                        owner={ownerName}
                        dataEntry={datasheet}
                        showOptions
                      />
                    );
                  })
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                    }}
                  >
                    NO DATASHEETS FOUND
                    <Button variant="outlined" color="primary" onClick={() => router.push('/me/datasheets')}>
                      Add
                    </Button>
                  </Box>
                )}
              </PricingsGrid>
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
}