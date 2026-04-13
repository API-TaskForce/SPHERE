import { Helmet } from 'react-helmet';
import { useEffect, useState } from 'react';
import SearchBar from '../../../pricing/components/search-bar';
import PricingsPagination from '../../../pricing/components/pricings-pagination';
import PricingsListContainer from '../../../pricing/components/pricings-list-container';
import { v4 as uuidv4 } from 'uuid';
import DatasheetCollectionListCard from '../../components/collection-list-card';
import DatasheetCollectionFilters from '../../components/collection-filters';

type DatasheetCollectionEntry = {
  id: string;
  name: string;
  owner: { id: string; username: string; avatar: string };
  numberOfDatasheets?: number;
  numberOfPricings?: number;
};

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
    if (textFilterValue.trim()) filterParams.append('name', textFilterValue.trim());
    Object.entries(filterValues as Record<string, string>).forEach(([key, value]) => {
      if (value && value.trim().length > 0) filterParams.append(key, value);
    });

    fetch(`${import.meta.env.VITE_API_URL}/datasheets/collections?${filterParams.toString()}`)
      .then(response => {
        if (!response.ok) return Promise.reject(response);
        return response.json();
      })
      .then(data => {
        setCollectionsList(data.collections ?? []);
        setTotalCount(data.total || 0);
      })
      .catch(error => console.error('Error:', error));
  }, [textFilterValue, filterValues, limit, offset]);

  return (
    <>
      <Helmet>
        <title> SPHERE - Datasheet Collections </title>
      </Helmet>
      <div className="flex w-screen max-w-[2000px] h-full items-center justify-center">
        <div className="flex flex-col items-center justify-start max-w-[600px] h-full m-auto bg-sphere-grey-200 border-r border-sphere-grey-300">
          <div className="w-[20vw]" />
          {collectionsList.length > 0 && (
            <DatasheetCollectionFilters
              receivedOwners={collectionsList.reduce((acc, c) => {
                acc[c.owner.username] = (acc[c.owner.username] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)}
              textFilterValue={textFilterValue}
              setFilterValues={setFilterValues}
            />
          )}
        </div>
        <div className="flex flex-col items-center justify-center mt-[50px] flex-1">
          <SearchBar setTextFilterValue={setTextFilterValue} />
          <PricingsListContainer>
            <div className="flex flex-wrap w-full justify-evenly gap-12 mt-[50px] px-[10px] mb-[50px]">
              {collectionsList.length > 0 ? (
                collectionsList.map(collection => (
                  <DatasheetCollectionListCard key={uuidv4()} collection={collection} />
                ))
              ) : (
                <div>No datasheet collections found</div>
              )}
            </div>
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
        </div>
      </div>
    </>
  );
}
