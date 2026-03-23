import { AnalyticsDataEntry } from '../../../assets/data/analytics';

export type DatasheetPeriod = {
  value: number;
  unit: string;
};

export type DatasheetMetric = {
  value: number | string;
  unit: string;
  period: string | DatasheetPeriod;
  windowType?: 'rolling' | 'fixed_utc_midnight' | 'fixed_billing_cycle' | string;
  overageCost?: {
    price: number | string;
    value: number;
  };
};

export type DatasheetPlanAlias = {
  rate?: string;
  quota?: string;
};

export type DatasheetWorkload = {
  unit: string;
  min: number;
  max: number;
  description?: string;
};

export type DatasheetEndpoint = {
  quota?: string;
  rate?: string;
  workload?: DatasheetWorkload;
} & Record<string, unknown>;

export type DatasheetPlanPeriod = {
  value: number;
  unit: string;
};

export type DatasheetPlan = {
  price: number | string;
  period?: DatasheetPlanPeriod;
  billingPeriod?: string;
  quota?: string;
  rate?: string;
  endpoints: Record<string, DatasheetEndpoint>;
};

export type DatasheetMockModel = {
  saasName: string;
  type: string;
  sourceUrl: string;
  syntaxVersion: string;
  date: string;
  currency?: string;
  consumptionUnits?: string[];
  capacity: Record<string, DatasheetMetric>;
  maxPower: Record<string, DatasheetMetric>;
  plans: Record<string, DatasheetPlan>;
};

export const VIMEO_MOCK_DATASHEET: DatasheetMockModel = {
  saasName: 'vimeo',
  type: 'partial_saas',
  sourceUrl: 'https://developer.vimeo.com/guidelines/rate-limiting',
  syntaxVersion: '0.3',
  date: '2026-03-09',
  currency: 'USD',
  consumptionUnits: ['requests'],
  capacity: {
    quota_requests_general_free: {
      value: 25,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
      windowType: 'fixed_billing_cycle',
    },
    quota_requests_filtered_free: {
      value: 50,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
      windowType: 'fixed_billing_cycle',
    },
    quota_requests_general_starter: {
      value: 125,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
      windowType: 'fixed_billing_cycle',
    },
    quota_requests_filtered_starter: {
      value: 250,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
      windowType: 'fixed_billing_cycle',
    },
    quota_requests_general_standard: {
      value: 250,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
      windowType: 'fixed_billing_cycle',
    },
    quota_requests_filtered_standard: {
      value: 500,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
      windowType: 'fixed_billing_cycle',
    },
    quota_requests_general_advanced: {
      value: 750,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
      windowType: 'fixed_billing_cycle',
    },
    quota_requests_filtered_advanced: {
      value: 1500,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
      windowType: 'fixed_billing_cycle',
    },
    quota_requests_general_enterprise: {
      value: 2500,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
      windowType: 'fixed_billing_cycle',
    },
    quota_requests_filtered_enterprise: {
      value: 5000,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
      windowType: 'fixed_billing_cycle',
    },
  },
  maxPower: {
    rate_requests_general_free: {
      value: 25,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
    },
    rate_requests_filtered_free: {
      value: 50,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
    },
    rate_requests_general_starter: {
      value: 125,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
    },
    rate_requests_filtered_starter: {
      value: 250,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
    },
    rate_requests_general_standard: {
      value: 250,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
    },
    rate_requests_filtered_standard: {
      value: 500,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
    },
    rate_requests_general_advanced: {
      value: 750,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
    },
    rate_requests_filtered_advanced: {
      value: 1500,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
    },
    rate_requests_general_enterprise: {
      value: 2500,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
    },
    rate_requests_filtered_enterprise: {
      value: 5000,
      unit: 'requests',
      period: { value: 1, unit: 'MIN' },
    },
  },
  plans: {
    free: {
      price: 0,
      period: { value: 1, unit: 'MONTH' },
      endpoints: {
        '/*': {
          general: { rate: 'rate_requests_general_free', quota: 'quota_requests_general_free' },
          filtered: {
            rate: 'rate_requests_filtered_free',
            quota: 'quota_requests_filtered_free',
          },
        },
      },
    },
    starter: {
      price: 8,
      period: { value: 1, unit: 'MONTH' },
      endpoints: {
        '/*': {
          general: {
            rate: 'rate_requests_general_starter',
            quota: 'quota_requests_general_starter',
          },
          filtered: {
            rate: 'rate_requests_filtered_starter',
            quota: 'quota_requests_filtered_starter',
          },
        },
      },
    },
    standard: {
      price: 19,
      period: { value: 1, unit: 'MONTH' },
      endpoints: {
        '/*': {
          general: {
            rate: 'rate_requests_general_standard',
            quota: 'quota_requests_general_standard',
          },
          filtered: {
            rate: 'rate_requests_filtered_standard',
            quota: 'quota_requests_filtered_standard',
          },
        },
      },
    },
    advanced: {
      price: 69,
      period: { value: 1, unit: 'MONTH' },
      endpoints: {
        '/*': {
          general: {
            rate: 'rate_requests_general_advanced',
            quota: 'quota_requests_general_advanced',
          },
          filtered: {
            rate: 'rate_requests_filtered_advanced',
            quota: 'quota_requests_filtered_advanced',
          },
        },
      },
    },
    enterprise: {
      price: 'custom',
      period: { value: 1, unit: 'MONTH' },
      endpoints: {
        '/*': {
          general: {
            rate: 'rate_requests_general_enterprise',
            quota: 'quota_requests_general_enterprise',
          },
          filtered: {
            rate: 'rate_requests_filtered_enterprise',
            quota: 'quota_requests_filtered_enterprise',
          },
        },
      },
    },
  },
};

export const VIMEO_MOCK_LIST_ENTRY = {
  name: 'vimeo',
  owner: 'mock',
  version: 'v1',
  collectionName: 'datasheet-mocks',
  extractionDate: '2026-03-09T00:00:00.000Z',
  currency: 'USD',
  analytics: {
    configurationSpaceSize: 5,
    minSubscriptionPrice: 0,
    maxSubscriptionPrice: 69,
  },
};

export const VIMEO_MOCK_VERSION_ENTRY = {
  id: 'mock-vimeo-v1',
  name: 'vimeo',
  owner: {
    id: 'mock-owner',
    username: 'mock',
  },
  collectionName: 'datasheet-mocks',
  private: false,
  _collectionId: '',
  collection: '',
  version: 'v1',
  extractionDate: '2026-03-09T00:00:00.000Z',
  currency: 'USD',
  yaml: '/mock-datasheets/vimeo.yaml',
  analytics: {},
} as unknown as AnalyticsDataEntry;
