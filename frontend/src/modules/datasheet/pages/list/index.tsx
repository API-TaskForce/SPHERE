import { Box, styled } from '@mui/material';
import { Helmet } from 'react-helmet';
import { useEffect, useState } from 'react';
import SearchBar from '../../../pricing/components/search-bar';
import { flex } from '../../../core/theme/css';
import PricingFilters from '../../../pricing/components/pricing-filters';
import { grey } from '../../../core/theme/palette';
import PricingsPagination from '../../../pricing/components/pricings-pagination';
import PricingsListContainer from '../../../pricing/components/pricings-list-container';
import { VIMEO_MOCK_LIST_ENTRY } from '../../mocks/vimeoMock';
import DatasheetListCard from '../../components/datasheet-list-card';

export const DatasheetsGrid = styled(Box)(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
  justifyContent: 'space-evenly',
  gap: '3rem',
  marginTop: '50px',
  padding: '0 10px',
}));

export type DatasheetEntry = {
  name: string;
  owner: string;
  version: string;
  collectionName: string;
  extractionDate: string;
  currency: string;
  analytics: {
    configurationSpaceSize: number;
    minSubscriptionPrice: number;
    maxSubscriptionPrice: number;
  };
};

export type FilterValues = {
  max: number;
  min: number;
  data: {
    value: string;
    count: number;
  }[];
};

export type FilterLimits = {
  [key: string]: FilterValues;
};

export default function DatasheetListPage() {
  const [datasheetsList, setDatasheetsList] = useState<DatasheetEntry[]>([]);
  const [filterLimits, setFilterLimits] = useState<FilterLimits | null>(null);
  const [filterValues, setFilterValues] = useState({});
  const [textFilterValue, setTextFilterValue] = useState('');
  const [limit, setLimit] = useState<number>(12);
  const [offset, setOffset] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const filterParams = new URLSearchParams();
    const normalizedFilter = textFilterValue.trim().toLowerCase();
    const shouldIncludeVimeoMock =
      normalizedFilter.length === 0 ||
      VIMEO_MOCK_LIST_ENTRY.name.includes(normalizedFilter) ||
      VIMEO_MOCK_LIST_ENTRY.owner.includes(normalizedFilter);

    if (textFilterValue.trim().length > 0) {
      filterParams.append('name', textFilterValue);
    }

    Object.entries(filterValues as Record<string, string | FilterValues | string[] | number[]>)
      .forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (typeof value[0] === 'number') {
            if (value[0]) filterParams.append('min-' + key.replace('Range', ''), value[0].toString());
            if (value[1]) filterParams.append('max-' + key.replace('Range', ''), value[1].toString());
          } else if (typeof value[0] === 'string') {
            const owners = (value as string[]).join(',');
            if (owners.length > 0) filterParams.append(key, owners);
          }
        } else if (typeof value === 'string' && value.trim().length > 0) {
          filterParams.append(key, value);
        }
      });

    filterParams.append('limit', String(limit));
    filterParams.append('offset', String(offset));

    fetch(`${import.meta.env.VITE_API_URL}/datasheets?${filterParams.toString()}`)
      .then(response => {
        if (!response.ok) {
          return Promise.reject(response);
        }
        return response.json();
      })
      .then(data => {
        const retrievedDatasheets = data.datasheets || data.pricings || [];
        const datasheetsWithMock = [...retrievedDatasheets];

        if (
          shouldIncludeVimeoMock &&
          !datasheetsWithMock.some(
            (entry: DatasheetEntry) => entry.name === 'vimeo' && entry.owner === 'mock'
          )
        ) {
          datasheetsWithMock.unshift(VIMEO_MOCK_LIST_ENTRY as DatasheetEntry);
        }

        setDatasheetsList(datasheetsWithMock);
        if (typeof data.total === 'number') {
          setTotalCount(Math.max(data.total, datasheetsWithMock.length));
        } else if (Array.isArray(datasheetsWithMock)) {
          setTotalCount(offset + datasheetsWithMock.length);
        }

        if (datasheetsWithMock.length > 0) {
          setFilterLimits({
            minPrice: data.minPrice ?? { min: 0, max: 69, data: [] },
            maxPrice: data.maxPrice ?? { min: 0, max: 69, data: [] },
            configurationSpaceSize: data.configurationSpaceSize ?? { min: 1, max: 5, data: [] },
            owners: datasheetsWithMock.map((datasheet: DatasheetEntry) => datasheet.owner),
          });
        } else {
          setFilterLimits({
            minPrice: { min: 0, max: 0, data: [] },
            maxPrice: { min: 0, max: 0, data: [] },
            configurationSpaceSize: { min: 0, max: 0, data: [] },
            owners: [],
          } as unknown as FilterLimits);
        }
      })
      .catch(error => {
        console.error('Error:', error);

        if (shouldIncludeVimeoMock) {
          setDatasheetsList([VIMEO_MOCK_LIST_ENTRY as DatasheetEntry]);
          setTotalCount(1);
          setFilterLimits({
            minPrice: { min: 0, max: 69, data: [] },
            maxPrice: { min: 0, max: 69, data: [] },
            configurationSpaceSize: { min: 1, max: 5, data: [] },
            owners: ['mock'],
          } as unknown as FilterLimits);
        } else {
          setDatasheetsList([]);
          setTotalCount(0);
        }
      });
  }, [textFilterValue, filterValues, limit, offset]);

  return (
    <>
      <Helmet>
        <title> SPHERE - Datasheets </title>
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
          {filterLimits && (
            <PricingFilters
              filterLimits={filterLimits as any}
              receivedOwners={datasheetsList.reduce((acc, datasheet) => {
                acc[datasheet.owner] = (acc[datasheet.owner] || 0) + 1;
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
            <DatasheetsGrid sx={{ marginBottom: '50px' }}>
              {datasheetsList.length > 0 ? (
                Object.values(datasheetsList).map(datasheet => (
                  <DatasheetListCard
                    key={`datasheet-${datasheet.owner}-${datasheet.collectionName}-${datasheet.name}`}
                    name={datasheet.name}
                    owner={datasheet.owner}
                    dataEntry={datasheet}
                  />
                ))
              ) : (
                <Box>No datasheets found</Box>
              )}
            </DatasheetsGrid>

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