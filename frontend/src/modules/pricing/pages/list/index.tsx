import { Box, styled } from '@mui/material';
import { Helmet } from 'react-helmet';
import { useEffect, useState } from 'react';
import { SAMPLES } from '../../mock/registry';
import PricingListCard from '../../components/pricing-list-card';
import { usePricingsApi } from '../../api/pricingsApi';
import SearchBar from '../../components/search-bar';
import { flex } from '../../../core/theme/css';
import PricingFilters from '../../components/pricing-filters';
import { grey } from '../../../core/theme/palette';
import PricingsPagination from '../../components/pricings-pagination';
import PricingsListContainer from '../../components/pricings-list-container';

export const PricingsGrid = styled(Box)(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
  justifyContent: 'space-evenly',
  gap: '3rem',
  marginTop: '50px',
  padding: '0 10px',
}));

export type PricingEntry = {
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

export default function PricingListPage() {
  const [pricingsList, setPricingsList] = useState<PricingEntry[]>([]);
  const [filterLimits, setFilterLimits] = useState<FilterLimits | null>(null);
  const [filterValues, setFilterValues] = useState({});
  const [textFilterValue, setTextFilterValue] = useState('');
  const [limit, setLimit] = useState<number>(12);
  const [offset, setOffset] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const { getPricings } = usePricingsApi();
  // single effect handling initial load, filters and pagination
  useEffect(() => {
    const filters: Record<string, string | FilterValues | number | undefined> = {
      name: textFilterValue,
      ...filterValues,
    };

    // Helper to generate sample entries
    const getSampleEntries = () => {
      // If filtering by SaaS, do not show samples (assuming samples are API examples)
      if (filterValues && (filterValues as any).typeFilter === 'SaaS') {
        return [];
      }

      const entries: PricingEntry[] = [];
      Object.entries(SAMPLES).forEach(([key, sample]) => {
        try {
          // If text filter is active, only show matching samples (by name or key)
          if (
            textFilterValue &&
            !sample.title.toLowerCase().includes(textFilterValue.toLowerCase()) &&
            !key.toLowerCase().includes(textFilterValue.toLowerCase())
          ) {
            return;
          }

          const samplePricing = sample.getPricing();
          if (samplePricing) {
            const plans = samplePricing.plans ? Object.keys(samplePricing.plans) : [];
            const planPrices = plans
              .map(p => {
                const price = samplePricing.plans?.[p]?.price;
                return typeof price === 'number' ? price : 0;
              })
              .filter(Number.isFinite);

            const minPrice = planPrices.length ? Math.min(...planPrices) : 0;
            const maxPrice = planPrices.length ? Math.max(...planPrices) : 0;

            const extractionDate =
              samplePricing.createdAt instanceof Date
                ? samplePricing.createdAt.toISOString()
                : typeof samplePricing.createdAt === 'string'
                  ? samplePricing.createdAt
                  : new Date().toISOString();

            entries.push({
              name: key,
              owner: 'samples',
              version: samplePricing.version || '2026',
              collectionName: '',
              extractionDate: extractionDate,
              currency: samplePricing.currency || 'USD',
              analytics: {
                configurationSpaceSize: plans.length,
                minSubscriptionPrice: minPrice,
                maxSubscriptionPrice: maxPrice,
              },
            });
          }
        } catch (err) {
          console.warn(`Could not inject sample pricing ${key}:`, err);
        }
      });
      return entries;
    };

    getPricings({ ...filters, limit, offset })
      .then(data => {
        let fetchedPricings = data.pricings || [];
        const isApiFilter = (filterValues as any).typeFilter === 'API';

        // If filtering by API, only show samples (mock logic per user request)
        if (isApiFilter) {
          fetchedPricings = [];
        }

        const sampleEntries = getSampleEntries();

        // Merge: avoid duplicates if backend somehow returned the same (unlikely for samples)
        // Add samples to the beginning
        fetchedPricings = [...sampleEntries, ...fetchedPricings];

        setPricingsList(fetchedPricings);

        // Update totals
        if (typeof data.total === 'number') {
          setTotalCount(data.total); // Backend total usually doesn't count local samples
        } else {
          setTotalCount(offset + fetchedPricings.length);
        }

        // Set filters based on available data
        if (fetchedPricings.length > 0) {
          setFilterLimits({
            minPrice: data.minPrice || { min: 0, max: 0, data: [] },
            maxPrice: data.maxPrice || { min: 0, max: 0, data: [] },
            configurationSpaceSize: data.configurationSpaceSize || { min: 0, max: 0, data: [] },
            owners: data.pricings ? data.pricings.map((pricing: PricingEntry) => pricing.owner) : [],
          });
        } else {
          setFilterLimits(null);
        }
      })
      .catch(error => {
        console.error('API Error, falling back to samples:', error);
        // Fallback: Show only samples if API fails
        const sampleEntries = getSampleEntries();
        setPricingsList(sampleEntries);
        setTotalCount(sampleEntries.length);
        // We can't really set meaningful filter limits without backend stats, but we can set defaults
        setFilterLimits({
          minPrice: { min: 0, max: 0, data: [] },
          maxPrice: { min: 0, max: 0, data: [] },
          configurationSpaceSize: { min: 0, max: 0, data: [] },
          owners: {
            min: 0,
            max: 0,
            data: sampleEntries.map(p => ({ value: p.owner, count: 1 })),
          },
        });
      });
  }, [textFilterValue, filterValues, limit, offset, getPricings]);

  return (
    <>
      <Helmet>
        <title> SPHERE - Pricings </title>
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
              filterLimits={filterLimits}
              receivedOwners={pricingsList.reduce((acc, pricing) => {
                acc[pricing.owner] = (acc[pricing.owner] || 0) + 1;
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
            <PricingsGrid sx={{ marginBottom: '50px' }}>
              {pricingsList.length > 0 ? (
                Object.values(pricingsList).map(pricing => (
                  <PricingListCard
                    key={`pricing-${pricing.owner}-${pricing.collectionName}-${pricing.name}`}
                    name={pricing.name}
                    owner={pricing.owner}
                    dataEntry={pricing}
                  />
                ))
              ) : (
                <Box>No pricings found</Box>
              )}
            </PricingsGrid>

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
