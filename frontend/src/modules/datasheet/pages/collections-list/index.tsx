import { Box, styled } from '@mui/material';
import { Helmet } from 'react-helmet';
import { useEffect, useState } from 'react';
import SearchBar from '../../../pricing/components/search-bar';
import { flex } from '../../../core/theme/css';
import { grey } from '../../../core/theme/palette';
import PricingsPagination from '../../../pricing/components/pricings-pagination';
import PricingsListContainer from '../../../pricing/components/pricings-list-container';
import { v4 as uuidv4 } from 'uuid';
import DatasheetCollectionListCard from '../../components/collection-list-card';
import DatasheetCollectionFilters from '../../components/collection-filters';

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

export const DatasheetCollectionsGrid = styled(Box)(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
  justifyContent: 'space-evenly',
  gap: '3rem',
  marginTop: '50px',
  padding: '0 10px',
}));

export default function DatasheetCollectionsListPage() {
  const [collectionsList, setCollectionsList] = useState<DatasheetCollectionEntry[]>([]);
  const [filterValues, setFilterValues] = useState({});
  const [textFilterValue, setTextFilterValue] = useState('');
  const [limit, setLimit] = useState<number>(12);
  const [offset, setOffset] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const filterParams = new URLSearchParams();
    filterParams.append('limit', String(limit));
    filterParams.append('offset', String(offset));

    if (textFilterValue.trim()) {
      filterParams.append('name', textFilterValue.trim());
    }

    Object.entries(filterValues as Record<string, string>).forEach(([key, value]) => {
      if (value && value.trim().length > 0) {
        filterParams.append(key, value);
      }
    });

    fetch(`${import.meta.env.VITE_API_URL}/datasheets/collections?${filterParams.toString()}`)
      .then(response => {
        if (!response.ok) {
          return Promise.reject(response);
        }
        return response.json();
      })
      .then(data => {
        const retrievedCollections = data.collections ?? [];
        setCollectionsList(retrievedCollections);
        setTotalCount(data.total || 0);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }, [textFilterValue, filterValues, limit, offset]);

  return (
    <>
      <Helmet>
        <title> SPHERE - Datasheet Collections </title>
      </Helmet>
      <Box
        sx={{
          ...flex({}),
          width: '100vw',
          maxWidth: '2000px',
          height: '100%',
        }}
      >
        <Box
          component="div"
          sx={{
            ...flex({ direction: 'column', justify: 'start' }),
            maxWidth: '600px',
            height: '100%',
            margin: 'auto',
            backgroundColor: grey[200],
            borderRight: '1px solid',
            borderRightColor: grey[300],
          }}
        >
          <Box component="div" width="20vw"></Box>
          {collectionsList.length > 0 && (
            <DatasheetCollectionFilters
              receivedOwners={collectionsList.reduce((acc, collection) => {
                acc[collection.owner.username] = (acc[collection.owner.username] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)}
              textFilterValue={textFilterValue}
              setFilterValues={setFilterValues}
            />
          )}
        </Box>
        <Box
          component="div"
          sx={{
            ...flex({ direction: 'column' }),
            marginTop: '50px',
            flexGrow: 1,
          }}
        >
          <SearchBar setTextFilterValue={setTextFilterValue} />
          <PricingsListContainer>
            <DatasheetCollectionsGrid sx={{ marginBottom: '50px' }}>
              {collectionsList.length > 0 ? (
                Object.values(collectionsList).map(collection => (
                  <DatasheetCollectionListCard key={uuidv4()} collection={collection} />
                ))
              ) : (
                <Box>No datasheet collections found</Box>
              )}
            </DatasheetCollectionsGrid>

            <PricingsPagination
              limit={limit}
              offset={offset}
              total={totalCount}
              onChange={(newOffset: number, newLimit: number) => {
                setOffset(newOffset);
                setLimit(newLimit);
              }}
            />
          </PricingsListContainer>
        </Box>
      </Box>
    </>
  );
}