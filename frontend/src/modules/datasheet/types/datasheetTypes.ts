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
  rate?: string | string[];
  quota?: string | string[];
  workload?: DatasheetWorkload | DatasheetWorkload[];
};

export type DatasheetWorkload = {
  unit: string;
  min: number;
  max: number;
  description?: string;
};

export type DatasheetEndpoint = {
  quota?: string | string[];
  rate?: string | string[];
  workload?: DatasheetWorkload | DatasheetWorkload[];
} & Record<string, unknown>;

export type DatasheetPlanPeriod = {
  value: number;
  unit: string;
};

export type DatasheetPlan = {
  price: number | string;
  period?: DatasheetPlanPeriod;
  billingPeriod?: string;
  quota?: string | string[];
  rate?: string | string[];
  endpoints: Record<string, DatasheetEndpoint>;
};

export type DatasheetModel = {
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
