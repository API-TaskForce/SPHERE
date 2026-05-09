import { IoMdAddCircleOutline } from 'react-icons/io';
import { FaSortAlphaDown, FaSortAlphaUpAlt } from "react-icons/fa";
import { usePricingCollectionsApi } from '../../api/pricingCollectionsApi';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from '../../../core/hooks/useRouter';
import CollectionsGrid from '../collections-grid';
import AddPricingToCollectionModal from '../add-pricing-to-collection-modal';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useOrganization } from '../../../organization/hooks/useOrganization';

export default function CollectionSection({
  pricingToAdd,
  addPricingToCollectionModalOpen,
  setAddPricingToCollectionModalOpen,
  renderFlag,
  setRenderFlag
}: {
  pricingToAdd: string;
  addPricingToCollectionModalOpen: boolean;
  setAddPricingToCollectionModalOpen: (value: boolean) => void;
  renderFlag: boolean;
  setRenderFlag: (value: boolean) => void;
}) {
  const [collections, setCollections] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { getLoggedUserCollections } = usePricingCollectionsApi();
  const { authUser } = useAuth();
  const { activeOrganization, isLoading: isOrgLoading } = useOrganization();
  const getLoggedUserCollectionsRef = useRef(getLoggedUserCollections);
  const router = useRouter();

  function handleAddCollection() {
    router.push('/pricings/collections/new');
  }

  function handleAddPricingToCollectionModalClose() {
    setRenderFlag(!renderFlag);
    setAddPricingToCollectionModalOpen(false);
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
  };

  useEffect(() => {
    getLoggedUserCollectionsRef.current = getLoggedUserCollections;
  }, [getLoggedUserCollections]);

  useEffect(() => {
    setCollections([]);
  }, [activeOrganization?.id]);

  useEffect(() => {
    if (authUser.isLoading || !authUser.isAuthenticated || isOrgLoading || !activeOrganization?.id) {
      return;
    }

    let isCurrentRequest = true;

    getLoggedUserCollectionsRef.current()
      .then(data => {
        if (!isCurrentRequest) return;

        if (data.error) {
          throw new Error(data.error);
        } else if (data.collections) {
          setCollections(data.collections);
        }
      })
      .catch(error => {
        if (!isCurrentRequest) return;
        console.error('Cannot GET collections. Error:', error);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [
    renderFlag,
    authUser.isLoading,
    authUser.isAuthenticated,
    isOrgLoading,
    activeOrganization?.id,
  ]);

  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
  }, [collections, sortOrder]);

  return (
    <>
      <div className="mb-4">
        {/* Header */}
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center p-[16px]">
            <h2 className="text-xl">
              Collections {collections.length > 0 && `(${collections.length})`}
            </h2>
            <button onClick={toggleSortOrder} type="button" className="ml-2 p-2">
              {sortOrder === "asc" ? <FaSortAlphaDown size={25} color="#637381" /> : <FaSortAlphaUpAlt size={25} color="#637381" />}
            </button>
          </div>
          <button type="button" className="p-2" onClick={handleAddCollection}>
            <IoMdAddCircleOutline size={28} />
          </button>
        </div>

        {/* List of collections */}
        <CollectionsGrid collections={sortedCollections} />
      </div>
      <AddPricingToCollectionModal
        pricingName={pricingToAdd}
        modalState={addPricingToCollectionModalOpen}
        handleClose={handleAddPricingToCollectionModalClose}
        collections={sortedCollections}
      />
    </>
  );
}
