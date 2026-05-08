import { Pricing } from "../types/database/Pricing";

export const calculateAnalyticsForPricings = (pricings: any) => {
  if (!pricings?.length) {
    return {
      evolutionOfPlans: { dates: [], values: [] },
      evolutionOfAddOns: { dates: [], values: [] },
      evolutionOfFeatures: { dates: [], values: [] },
      evolutionOfConfigurationSpaceSize: { dates: [], values: [] },
    };
  }

  const extractionDates = _simulateCollectionEvolution(pricings);

  const analyticsByMonth = _getAnalyticsEvolution(extractionDates);

  return {
    evolutionOfPlans: {
      dates: Object.keys(analyticsByMonth),
      values: Object.values(analyticsByMonth).map(analytics => analytics.avgPlans),
    },
    evolutionOfAddOns: {
      dates: Object.keys(analyticsByMonth),
      values: Object.values(analyticsByMonth).map(analytics => analytics.avgAddOns),
    },
    evolutionOfFeatures: {
      dates: Object.keys(analyticsByMonth),
      values: Object.values(analyticsByMonth).map(analytics => analytics.avgFeatures),
    },
    evolutionOfConfigurationSpaceSize: {
      dates: Object.keys(analyticsByMonth),
      values: Object.values(analyticsByMonth).map(
        analytics => analytics.avgConfigurationSpaceSize
      ),
    },
  };
};

function _simulateCollectionEvolution(pricings: Pricing[]) {
  const pricingsByDate: Record<string, any[]> = {};

  const extractionDates = pricings.map((pricing: any) => new Date(pricing.extractionDate));
  const minDate = new Date(Math.min(...extractionDates.map(date => date.getTime())));
  const maxDate = new Date(Math.max(...extractionDates.map(date => date.getTime())));
  maxDate.setMonth(maxDate.getMonth() + 12); // Added four months to include the pricing with the las extraction date and stabilise the analytics

  for (let date = new Date(minDate); date <= maxDate; date.setMonth(date.getMonth() + 12)) {
    const isoDate = date.toISOString().split('T')[0];
    const filteredPricings = pricings.filter(
      (pricing: any) => new Date(pricing.extractionDate) <= date
    );

    const latestPricings: Record<string, any> = {};

    // If many versions of the same pricing pass the filter, select the most recent version
    for (const pricing of filteredPricings) {
      if (
        !latestPricings[pricing.name] ||
        new Date(pricing.extractionDate) > new Date(latestPricings[pricing.name].extractionDate)
      ) {
        latestPricings[pricing.name] = pricing;
      }
    }

    pricingsByDate[isoDate] = Object.values(latestPricings);
  }

  return pricingsByDate;
}

function _getAnalyticsEvolution(extractionDates: Record<string, any>) {
  const analyticsEvolution: Record<
    string,
    { avgPlans: number; avgAddOns: number; avgFeatures: number; avgConfigurationSpaceSize: number }
  > = {};

  for (const date in extractionDates) {
    const pricings = extractionDates[date];
    const metric = (pricing: any, key: string) => pricing.analytics?.[key] ?? 0;
    
    analyticsEvolution[date] = {
      avgPlans:
        pricings.reduce((acc: number, pricing: any) => acc + metric(pricing, 'numberOfPlans'), 0) /
        pricings.length,
      avgAddOns:
        pricings.reduce((acc: number, pricing: any) => acc + metric(pricing, 'numberOfAddOns'), 0) /
        pricings.length,
      avgFeatures:
        pricings.reduce(
          (acc: number, pricing: any) => acc + metric(pricing, 'numberOfFeatures'),
          0
        ) / pricings.length,
      avgConfigurationSpaceSize:
        pricings.reduce(
          (acc: number, pricing: any) => acc + metric(pricing, 'configurationSpaceSize'),
          0
        ) / pricings.length,
    };
  }

  return analyticsEvolution;
}
