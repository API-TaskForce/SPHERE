import { usePricings } from '../hooks/usePricings';
import { Box, Skeleton, Pagination, TextField, Chip } from '@mui/material';
import { useState } from 'react';
import { SphereContextItemInput } from '../types/types';
import PricingsList from './PricingList';

interface SearchPricingsProps {
  onContextAdd: (input: SphereContextItemInput) => void;
  onContextRemove: (id: string) => void;
}

function SearchPricings({ onContextAdd, onContextRemove }: SearchPricingsProps) {
  const [search, setSearch] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const limit = 10;
  const { loading, error, pricings: result } = usePricings(search, offset, limit);

  const currentPage = offset / limit + 1;
  const totalPages = Math.ceil(result.total / limit);

  function handleSeachChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearch(event.currentTarget.value);
    setOffset(0);
  }

  const handlePaginationChange = (_: React.ChangeEvent<unknown>, page: number) =>
    setOffset((page - 1) * limit);

  if (error) {
    return <Box>Something went wrong...</Box>;
  }

  const hasResults = result.pricings.length > 0;

  return (
    <Box component="section">
      <TextField label="Pricing name" variant="standard" onChange={handleSeachChange} fullWidth />
      {!loading ? (
        <>
          <Chip
            label={`${result.total} results`}
            color="primary"
            variant="outlined"
            sx={{ m: 1 }}
          />

          <PricingsList
            pricings={result.pricings}
            onContextAdd={onContextAdd}
            onContextRemove={onContextRemove}
          />
        </>
      ) : (
        <Skeleton width={1100} height={1200} />
      )}
      <Pagination
        size="large"
        count={totalPages}
        page={currentPage}
        disabled={!hasResults}
        onChange={handlePaginationChange}
      />
    </Box>
  );
}

export default SearchPricings;
