import { Helmet } from 'react-helmet';
import { useEffect, useState } from 'react';
import SearchBar from '../../../pricing/components/search-bar';
import PricingsPagination from '../../../pricing/components/pricings-pagination';
import PricingsListContainer from '../../../pricing/components/pricings-list-container';
import DatasheetListCard from '../../components/datasheet-list-card';
import { useDatasheetsApi } from '../../api/datasheetsApi';

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
  data: { value: string; count: number }[];
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
        if (typeof data.total === 'number') setTotalCount(data.total);
        else if (Array.isArray(data.datasheets)) setTotalCount(offset + data.datasheets.length);
      })
      .catch(error => console.error('Error:', error));
  }, [textFilterValue, filterValues, limit, offset, getDatsheets]);

  return (
    <>
      <Helmet>
        <title> SPHERE - Datasheets </title>
      </Helmet>
      <div className="flex w-screen max-w-[2000px] h-full items-center justify-center">
        <div className="flex flex-col items-center justify-start max-w-[600px] h-full m-auto bg-sphere-grey-200 border-r border-sphere-grey-300">
          <div className="w-[20vw]" />
        </div>
        <div className="flex flex-col items-center justify-center mt-[50px] flex-1">
          <SearchBar setTextFilterValue={setTextFilterValue} />
          <PricingsListContainer>
            <div className="flex flex-wrap w-full justify-evenly gap-12 mt-[50px] px-[10px] mb-[50px]">
              {datasheetsList.length > 0 ? (
                datasheetsList.map(datasheet => (
                  <DatasheetListCard
                    key={`datasheet-${datasheet.owner}-${datasheet.collectionName}-${datasheet.name}`}
                    name={datasheet.name}
                    owner={datasheet.owner}
                    dataEntry={datasheet}
                  />
                ))
              ) : (
                <div>No datasheets found</div>
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
