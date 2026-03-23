import { Helmet } from 'react-helmet';
import { useEffect, useMemo, useState } from 'react';
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

type DatasheetCollection = {
  name: string;
  description?: string;
  owner: {
    id: string;
    username: string;
    avatar: string;
  };
  analytics?: {
    evolutionOfPlans?: { dates: string[] };
  };
  pricings?: Array<{
    datasheets?: any[];
    pricings?: any[];
  }>;
};

export default function DatasheetCollectionCardPage() {
  const [collection, setCollection] = useState<DatasheetCollection | undefined>(undefined);
  const [startDate, setStartDate] = useState<string | null>(new Date().toISOString());
  const [endDate, setEndDate] = useState<string | null>(new Date().toISOString());
  const [tabValue, setTabValue] = useState(0);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const segments = pathname.split('/');
    const name = segments.pop() as string;
    const ownerId = segments[segments.length - 1];

    fetch(`${import.meta.env.VITE_API_URL}/datasheets/collections/${ownerId}/${name}`)
      .then(response => {
        if (!response.ok) {
          return Promise.reject(response);
        }
        return response.json();
      })
      .then(collectionData => {
        if (collectionData) {
          setCollection(collectionData);
          if (collectionData.analytics?.evolutionOfPlans?.dates?.length > 0) {
            setStartDate(collectionData.analytics.evolutionOfPlans.dates[0]);
            setEndDate(
              collectionData.analytics.evolutionOfPlans.dates[
                collectionData.analytics.evolutionOfPlans.dates.length - 1
              ]
            );
          }
        } else {
          router.push('/error');
        }
      })
      .catch(() => {
        router.push('/error');
      });
  }, [pathname, router]);

  const handleInputDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(new Date(e.target.value).toISOString());
  };

  const handleOutputDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(new Date(e.target.value).toISOString());
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const sortedDatasheets = useMemo(() => {
    if (!collection || !collection.pricings || collection.pricings.length === 0) {
      return [];
    }
    const entriesContainer = collection.pricings[0] ?? {};
    const datasheetArray =
      (entriesContainer.datasheets as any[]) ?? (entriesContainer.pricings as any[]) ?? [];

    return datasheetArray.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [collection, sortOrder]);

  const downloadCollection = async () => {
    if (!collection) return;
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/datasheets/collections/${collection.owner.id}/${collection.name}/download`
    );
    if (!response.ok) return;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = collection.name + '.zip';
    document.body.appendChild(anchor);
    anchor.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  };

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
                      onChange={handleInputDate}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      fullWidth
                      defaultValue={new Date().toISOString().split('T')[0]}
                      slotProps={{ inputLabel: { shrink: true } }}
                      onChange={handleOutputDate}
                    />
                  </>
                ) : null}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box display="flex" gap={4} sx={{ mb: 4 }}>
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
                  onClick={downloadCollection}
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
                    <Button variant="outlined" color="primary" onClick={() => router.push('/datasheets')}>
                      Browse
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