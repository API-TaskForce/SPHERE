import { useEffect, useState, useMemo, useRef } from 'react';
import { usePricingsApi } from '../../../pricing/api/pricingsApi';
import { PricingEntry } from '../../../pricing/pages/list';
import PricingListCard from '../../../pricing/components/pricing-list-card';
import { FaSortAlphaDown, FaSortAlphaUpAlt } from 'react-icons/fa';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useOrganization } from '../../../organization/hooks/useOrganization';

export default function PricingSection({
  setAddToCollectionModalOpen,
  setPricingToAdd,
  renderFlag,
}: {
  setAddToCollectionModalOpen: (value: boolean) => void;
  setPricingToAdd: (value: string) => void;
  renderFlag: boolean;
}) {
  const [pricings, setPricings] = useState<PricingEntry[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { getLoggedUserPricings } = usePricingsApi();
  const { authUser } = useAuth();
  const { activeOrganization, isLoading: isOrgLoading } = useOrganization();
  const getLoggedUserPricingsRef = useRef(getLoggedUserPricings);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  useEffect(() => {
    getLoggedUserPricingsRef.current = getLoggedUserPricings;
  }, [getLoggedUserPricings]);

  useEffect(() => {
    setPricings([]);
  }, [activeOrganization?.id]);

  useEffect(() => {
    if (authUser.isLoading || !authUser.isAuthenticated || isOrgLoading || !activeOrganization?.id) {
      return;
    }

    let isCurrentRequest = true;

    getLoggedUserPricingsRef.current()
      .then((data) => {
        if (!isCurrentRequest) return;

        if (data.error) {
          throw new Error(data.error);
        } else if (data.pricings) {
          setPricings(data.pricings.pricings);
        }
      })
      .catch((error) => {
        if (!isCurrentRequest) return;
        console.error('Cannot GET pricings. Error:', error);
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

  const sortedPricings = useMemo(() => {
    return [...pricings].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
  }, [pricings, sortOrder]);

  return (
    <div>
      {sortedPricings && sortedPricings.length > 0 && (
        <>
          <div className="mb-1 flex items-center p-[16px]">
            <h2 className="text-xl">
              Unassigned {sortedPricings.length > 0 && `(${sortedPricings.length})`}
            </h2>
            <button onClick={toggleSortOrder} type="button" className="ml-2 p-2">
              {sortOrder === "asc" ? <FaSortAlphaDown size={25} color="#637381" /> : <FaSortAlphaUpAlt size={25} color="#637381" />}
            </button>
          </div>
          <div className="mt-[30px] flex flex-col items-center justify-center gap-2">
            {sortedPricings.map((pricing: PricingEntry) => (
              <PricingListCard
                name={pricing.name}
                owner={pricing.owner}
                dataEntry={pricing}
                showOptions
                setPricingToAdd={setPricingToAdd}
                setAddToCollectionModalOpen={setAddToCollectionModalOpen}
                key={`pricing-${pricing.name}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
