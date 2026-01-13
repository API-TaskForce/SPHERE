import { Pricing } from 'pricing4ts';
import { getAzureAiSearchPricing, azureAiSearchYaml } from './azureAiSearchPricing';
import { getApiFootballPricing, apiFootballYaml } from './apiFootballPricing';
import type { Datasheet } from '../components/api-datasheet';

export const SAMPLES: Record<string, { getPricing: () => Pricing | null; yaml: string; title: string; datasheet?: Datasheet }> = {
    'azure-ai-search': {
        getPricing: getAzureAiSearchPricing,
        yaml: azureAiSearchYaml,
        title: 'Azure AI Search',
    },
    'api-football': {
        getPricing: getApiFootballPricing,
        yaml: apiFootballYaml,
        title: 'API-Football',
        datasheet: {
            associatedSaaS: {
                name: 'API-Football',
                url: 'https://rapidapi.com/api-sports/api/api-football/pricing'
            },
            type: 'Partial SaaS',
            capacity: [
                { value: '100 requests/day', autoRecharge: 'daily', extraCharge: 'None' },
                { value: '10240 MB/month', autoRecharge: 'monthly', extraCharge: '0.001 USD/MB' }
            ],
            maxPower: [
                {
                    value: '1000 requests/hour',
                    throttling: 'Fixed Window',
                    policies: ['IP-based rate limiting']
                }
            ],
            perRequestCost: '1 credit',
            coolingPeriod: { value: 'None', retryAfter: false },
            segmentation: 'By API Key',
            sharedLimits: 'Shared across all endpoints',
            extraFields: {
                'Bandwidth Optimization': 'Compression supported (gzip)',
                'Data Freshness': 'Real-time updates during matches'
            }
        }
    },
};
