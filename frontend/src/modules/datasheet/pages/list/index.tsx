import { Box, styled } from '@mui/material';
import { Helmet } from 'react-helmet';
import { useEffect, useState } from 'react';
import SearchBar from '../../../pricing/components/search-bar';
import { flex } from '../../../core/theme/css';
import { grey } from '../../../core/theme/palette';
import PricingsPagination from '../../../pricing/components/pricings-pagination';
import PricingsListContainer from '../../../pricing/components/pricings-list-container';
import DatasheetListCard from '../../components/datasheet-list-card';
import { useDatasheetsApi } from '../../api/datasheetsApi';

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

export default function DatasheetListPage() {
  const [datasheetsList, setDatasheetsList] = useState<DatasheetEntry[]>([]);
  const [filterValues, setFilterValues] = useState({});
  const [textFilterValue, setTextFilterValue] = useState('');
  const [limit, setLimit] = useState<number>(12);
  const [offset, setOffset] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const { getDatsheets } = useDatasheetsApi();

  useEffect(() => {
    const filters: Record<string, string | FilterValues | number | undefined> = {
      name: textFilterValue,
      ...filterValues,
    };

    getDatsheets({ ...filters, limit, offset })
      .then(data => {
        setDatasheetsList(data.datasheets || []);
        if (typeof data.total === 'number') {
          setTotalCount(data.total);
        } else if (Array.isArray(data.datasheets)) {
          setTotalCount(offset + data.datasheets.length);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }, [textFilterValue, filterValues, limit, offset, getDatsheets]);

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