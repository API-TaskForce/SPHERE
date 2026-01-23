import { useEffect, useState } from "react";
import { PricingVersionsResult } from "../sphere";
import { usePricingsApi } from "../../pricing/api/pricingsApi";

export function usePricingVersions(
  owner: string,
  name: string,
  collectionName?: string | null
) {
  const [versions, setVersions] = useState<PricingVersionsResult | undefined>(
    undefined
  );
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | undefined>(undefined);
  const { getPricingByName } = usePricingsApi()

  useEffect(() => {
    const makeRequest = async () => {
      try {
        setLoading(true)
        const data = await getPricingByName(name, owner, collectionName ?? null);
        if ("error" in data) {
          data.error;
          setError(Error(data.error));
        } else {
          setVersions(data);
        }
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false)
      }
    };
    makeRequest();
  }, []);

  return { loading, error, versions };
}
