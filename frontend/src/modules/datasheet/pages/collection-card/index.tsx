import { Helmet } from 'react-helmet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from '../../../core/hooks/usePathname';
import { useRouter } from '../../../core/hooks/useRouter';
import { FaSortAlphaDown, FaSortAlphaUpAlt } from 'react-icons/fa';
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
  owner: { id: string; username: string; avatar: string };
  analytics?: { evolutionOfPlans?: { dates: string[] } };
  datasheets?: any[];
  pricings?: Array<{ datasheets?: any[]; pricings?: any[] }>;
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
    if (!collection || !authUser?.user) return false;
    const sameId = collection.owner?.id && authUser.user.id ? collection.owner.id === authUser.user.id : false;
    const sameUsername = collection.owner?.username && authUser.user.username
      ? collection.owner.username.toLowerCase() === authUser.user.username.toLowerCase()
      : false;
    return sameId || sameUsername;
  }, [collection, authUser]);

  useEffect(() => {
    const segments = pathname.split('/');
    const name = segments.pop() as string;
    const ownerId = segments[segments.length - 1];
    const currentCollectionKey = `${ownerId}/${name}`;
    if (lastRequestedCollectionKeyRef.current === currentCollectionKey) return;
    lastRequestedCollectionKeyRef.current = currentCollectionKey;

    getCollectionByOwnerAndName(ownerId, name)
      .then(data => { if (data) setCollection(data); else router.push('/error'); })
      .catch(() => router.push('/error'));
  }, [pathname, router, getCollectionByOwnerAndName]);

  const toggleSortOrder = () => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));

  const sortedDatasheets = useMemo(() => {
    if (!collection) return [];
    const datasheetArray =
      Array.isArray(collection.datasheets?.[0]?.datasheets) ? (collection.datasheets?.[0]?.datasheets as any[]) :
      Array.isArray(collection.datasheets) ? collection.datasheets :
      Array.isArray(collection.pricings?.[0]?.datasheets) ? (collection.pricings?.[0]?.datasheets as any[]) :
      Array.isArray(collection.pricings?.[0]?.pricings) ? (collection.pricings?.[0]?.pricings as any[]) : [];

    return [...datasheetArray].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [collection, sortOrder]);

  const tabs = ['Collection card', ...(isCollectionOwner ? ['Settings'] : [])];

  return (
    <>
      <Helmet>
        <title>{`SPHERE - ${collection?.name} Datasheet Collection`}</title>
      </Helmet>
      <div className="max-w-[1536px] mx-auto px-4">
        <div className="my-8">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-2xl tracking-wide">{collection?.name}</h2>
              </div>
              <div className="border-b border-[#DFE3E8]">
                <div className="flex">
                  {tabs.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setTabValue(i)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        tabValue === i
                          ? 'border-sphere-primary-600 text-sphere-primary-600'
                          : 'border-transparent text-[#637381] hover:text-[#212B36]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {collection?.analytics?.evolutionOfPlans?.dates?.length ? (
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs text-[#637381] mb-1">Start Date</label>
                    <input
                      type="date"
                      defaultValue={new Date(collection.analytics.evolutionOfPlans.dates[0]).toISOString().split('T')[0]}
                      disabled
                      className="border border-[#DFE3E8] rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-[#637381] mb-1">End Date</label>
                    <input
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      disabled
                      className="border border-[#DFE3E8] rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex gap-8 mb-8">
          {tabValue === 1 && collection && (
            <DatasheetCollectionSettings collection={collection} updateCollectionMethod={setCollection} />
          )}
          {tabValue === 0 && (
            <div className="flex-1">
              <h6 className="text-lg font-bold mb-2">Description</h6>
              <p className="mb-8">{collection?.description || 'This collection has no description.'}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center -mb-4">
                  <h6 className="text-lg font-bold">Datasheets in Collection</h6>
                  <button onClick={toggleSortOrder} className="ml-2 p-1 rounded hover:bg-sphere-grey-200">
                    {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUpAlt />}
                  </button>
                </div>
                <button
                  className="border border-sphere-primary-400 text-sphere-primary-400 w-[150px] h-10 text-base font-bold -mb-4 rounded hover:bg-sphere-primary-400 hover:text-white transition-colors"
                  onClick={() => downloadCollection(collection?.owner.id as string, collection?.name as string)}
                >
                  DOWNLOAD
                </button>
              </div>

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
                      typeof datasheet.owner === 'string' ? datasheet.owner : datasheet.owner?.username || '';
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
                  <div className="flex flex-col gap-4 items-center justify-center h-full">
                    NO DATASHEETS FOUND
                    <button
                      className="px-4 py-2 border border-sphere-primary-600 text-sphere-primary-600 rounded hover:bg-sphere-primary-100 transition-colors"
                      onClick={() => router.push('/me/datasheets')}
                    >
                      Add
                    </button>
                  </div>
                )}
              </PricingsGrid>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
