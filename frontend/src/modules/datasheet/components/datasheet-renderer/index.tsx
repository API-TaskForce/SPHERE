import React from 'react';
import { motion } from 'framer-motion';
import {
  DatasheetEndpoint,
  DatasheetMetric,
  DatasheetModel,
  DatasheetPlanAlias,
  DatasheetPeriod,
  DatasheetWorkload,
} from '../../types/datasheetTypes';

// palette colors used throughout
const PLAN_COLORS = [
  '#00b4d8', // primary-500
  '#8E33FF', // secondary
  '#00A76F', // success
  '#FFAB00', // warning
  '#FF5630', // error
  '#E91E63',
  '#9C27B0',
  '#673AB7',
];

function alpha(hex: string, opacity: number): string {
  const n = hex.replace('#', '');
  const bigint = parseInt(n, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getPlanColor(index: number): string {
  return PLAN_COLORS[index % PLAN_COLORS.length];
}

function formatMetric(metric?: DatasheetMetric) {
  if (!metric) return 'Not defined';
  let periodStr = '';
  if (typeof metric.period === 'string') {
    periodStr = metric.period.toLowerCase();
  } else {
    const value = metric.period.value;
    const unit = String(metric.period.unit).toLowerCase();
    periodStr = value === 1 ? unit : `${value} ${unit}`;
  }
  return `${metric.value} ${String(metric.unit).toLowerCase()} / ${periodStr}`;
}

function getMetricOverage(metric?: DatasheetMetric): { price: number | string; value: number } | undefined {
  if (!metric) return undefined;
  const rawMetric = metric as DatasheetMetric & {
    overage_cost?: { price: number | string; value: number };
  };
  return rawMetric.overageCost ?? rawMetric.overage_cost;
}

function formatMetricOverage(metric?: DatasheetMetric) {
  const overage = getMetricOverage(metric);
  if (!overage || !metric) return null;
  return `Overage: ${formatPrice(overage.price)} / ${overage.value} ${String(metric.unit).toLowerCase()}`;
}

function formatPrice(value: string | number) {
  if (typeof value === 'number') return value === 0 ? '$0' : `$${value}`;
  const n = Number(value);
  if (!Number.isNaN(n)) return n === 0 ? '$0' : `$${n}`;
  return String(value).toUpperCase();
}

function formatPlanPeriod(period?: DatasheetPeriod, legacyBillingPeriod?: string) {
  if (period) {
    if (period.value === 1 && String(period.unit).toUpperCase() === 'MONTH') return 'month';
    return period.value === 1 ? String(period.unit).toLowerCase() : `${period.value} ${String(period.unit).toLowerCase()}`;
  }
  if (legacyBillingPeriod) {
    if (legacyBillingPeriod.trim().toUpperCase() === '1 MONTH') return 'month';
    return legacyBillingPeriod.toLowerCase();
  }
  return 'Not defined';
}

function extractAliases(endpoint: DatasheetEndpoint): Array<[string, DatasheetPlanAlias]> {
  return Object.entries(endpoint).filter(([key, value]) => {
    if (key === 'rate' || key === 'quota' || key === 'workload') return false;
    return typeof value === 'object' && value !== null;
  }) as Array<[string, DatasheetPlanAlias]>;
}

function normalizeWorkloads(workload?: DatasheetEndpoint['workload']): DatasheetWorkload[] {
  if (!workload) return [];
  return Array.isArray(workload) ? workload : [workload];
}

function formatWorkloadText(workload: DatasheetWorkload) {
  return `${workload.min} - ${workload.max} ${String(workload.unit).toLowerCase()}`;
}

function renderCrfValue(workload?: DatasheetEndpoint['workload']) {
  const workloads = normalizeWorkloads(workload);
  if (workloads.length === 0) return 'Not defined';

  return (
    <div className="flex flex-col gap-2">
      {workloads.map((entry, index) => (
        <div key={`${entry.unit}-${entry.min}-${entry.max}-${index}`}>
          <span className="block">{formatWorkloadText(entry)}</span>
          {entry.description && (
            <span className="block text-xs text-[#637381] mt-1">
              {entry.description}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function resolveMetricKeys(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function renderMetricValue(metric?: DatasheetMetric, compact = false): React.ReactNode {
  if (!metric) return 'Not defined';

  const overageText = formatMetricOverage(metric);
  if (!overageText) return formatMetric(metric);

  return (
    <div className="flex flex-col gap-1">
      <span>{formatMetric(metric)}</span>
      <span className={compact ? 'text-[0.68rem] text-[#637381]' : 'text-xs text-[#637381]'}>
        {overageText}
      </span>
    </div>
  );
}

type MetricEntry = {
  key: string;
  source: 'local' | 'plan';
};

function resolveMetricEntries(
  localValue?: string | string[],
  planValue?: string | string[]
): MetricEntry[] {
  const localKeys = resolveMetricKeys(localValue);
  const planKeys = resolveMetricKeys(planValue);
  const seen = new Set<string>();
  const entries: MetricEntry[] = [];

  localKeys.forEach(key => {
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ key, source: 'local' });
  });

  planKeys.forEach(key => {
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ key, source: 'plan' });
  });

  return entries;
}

function renderMetricEntries(
  entries: MetricEntry[],
  store: Record<string, DatasheetMetric> | undefined,
  compact = false,
  badgeColor?: string
): React.ReactNode {
  if (!store || entries.length === 0) return 'Not defined';
  if (entries.length === 1 && entries[0].source === 'local') {
    return renderMetricValue(store[entries[0].key], compact);
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => (
        <div key={`${entry.key}-${entry.source}-${i}`} className="flex items-start gap-2 flex-wrap">
          <span>{renderMetricValue(store[entry.key], compact)}</span>
          {entry.source === 'plan' && badgeColor && (
            <SharedBadge level="plan" color={badgeColor} />
          )}
        </div>
      ))}
    </div>
  );
}

function formatUnifiedRoute(endpoint: string, alias?: string) {
  const normalizedEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
  if (!alias) return normalizedEndpoint;
  const normalizedAlias = alias.replace(/^\/+|\/+$/g, '');
  if (!normalizedEndpoint) return normalizedAlias;
  return `${normalizedEndpoint}/${normalizedAlias}`;
}
void formatUnifiedRoute;

function resolveEffectiveWorkload(endpointWorkload?: DatasheetEndpoint['workload']) {
  return endpointWorkload;
}

const SharedBadge = ({ level, color }: { level: 'plan' | 'endpoint'; color: string }) => (
  <span
    className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.58rem] font-bold uppercase tracking-wider border whitespace-nowrap align-middle"
    style={{
      borderColor: alpha(color, 0.5),
      color,
      backgroundColor: alpha(color, 0.08),
    }}
  >
    SHARED: {level} level
  </span>
);

const MetricRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5 py-1.5 border-b border-dashed border-[#DFE3E8] last:border-b-0">
    <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#637381]">{label}</span>
    <span className="text-[0.85rem] font-medium text-[#212B36]">{value}</span>
  </div>
);

const PlanMetricItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="rounded-md border border-[#DFE3E8] px-3 py-2 bg-white/70">
    <span className="block text-[0.62rem] font-semibold uppercase tracking-wide text-[#637381]">{label}</span>
    <div className="mt-1 text-[0.82rem] font-semibold text-[#212B36]">{value}</div>
  </div>
);

export default function DatasheetRenderer({ datasheet }: { datasheet: DatasheetModel }) {
  const planKeys = Object.keys(datasheet.plans);

  const allEndpoints = new Set<string>();
  planKeys.forEach(planKey => {
    const planEndpoints = datasheet.plans[planKey]?.endpoints || {};
    Object.keys(planEndpoints).forEach(ep => allEndpoints.add(ep));
  });
  const endpointList = Array.from(allEndpoints).sort();

  // Colors for info/warning badges
  const infoColor = '#00B8D9';
  const warningColor = '#FFAB00';

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-extrabold text-[#212B36]">{datasheet.saasName}</h2>
        <div className="flex gap-4 items-center">
          <p className="text-sm text-[#637381]">
            Source:{' '}
            <a
              href={datasheet.sourceUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="text-sphere-primary-500 no-underline hover:underline"
            >
              {datasheet.sourceUrl || 'Not defined'}
            </a>
          </p>
          <p className="text-sm text-[#637381]">v{datasheet.syntaxVersion} · {datasheet.date}</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="border-separate" style={{ borderSpacing: '12px 0', minWidth: 800 }}>
          <thead>
            <tr>
              {planKeys.map((planKey, idx) => {
                const planColor = getPlanColor(idx);
                return (
                  <td
                    key={planKey}
                    className="p-0 align-top"
                    style={{ width: `${100 / planKeys.length}%`, minWidth: 260 }}
                  >
                    <div
                      className="rounded-lg p-6 mb-4 h-full border"
                      style={{
                        borderColor: alpha(planColor, 0.3),
                        borderTop: `4px solid ${planColor}`,
                        backgroundColor: alpha(planColor, 0.02),
                      }}
                    >
                      <p
                        className="font-extrabold text-xl capitalize mb-2"
                        style={{ color: planColor }}
                      >
                        {planKey}
                      </p>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="font-extrabold text-4xl leading-none">
                          {formatPrice(datasheet.plans[planKey].price)}
                        </span>
                        <span className="text-sm text-[#637381] font-medium">
                          / {formatPlanPeriod(datasheet.plans[planKey].period, datasheet.plans[planKey].billingPeriod)}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2">
                        {resolveMetricKeys(datasheet.plans[planKey].quota).map((key, i) => (
                          <PlanMetricItem
                            key={i}
                            label="Quota"
                            value={renderMetricValue(datasheet.capacity?.[key], true)}
                          />
                        ))}
                        {resolveMetricKeys(datasheet.plans[planKey].rate).map((key, i) => (
                          <PlanMetricItem
                            key={i}
                            label="Rate"
                            value={renderMetricValue(datasheet.maxPower?.[key], true)}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {endpointList.map((endpoint, endIdx) => (
              <motion.tr
                key={endpoint}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + endIdx * 0.02 }}
                style={{ display: 'table-row' }}
              >
                {planKeys.map((planKey, idx) => {
                  const plan = datasheet.plans[planKey];
                  const endpointExists = plan?.endpoints != null && endpoint in plan.endpoints;
                  const rawEndpointDef = endpointExists ? plan.endpoints[endpoint] : undefined;
                  const endpointDef = (rawEndpointDef ?? {}) as DatasheetEndpoint;
                  const planColor = getPlanColor(idx);

                  if (!endpointExists) {
                    return (
                      <td key={planKey} className="p-0 py-1 align-top">
                        <div
                          className="border border-dashed rounded-lg h-full flex items-center justify-center"
                          style={{ minHeight: 80, borderColor: '#DFE3E8' }}
                        >
                          <span className="text-[#919EAB] font-medium">Not available</span>
                        </div>
                      </td>
                    );
                  }

                  const effectiveRateEntries = resolveMetricEntries(endpointDef.rate, plan.rate);
                  const effectiveQuotaEntries = resolveMetricEntries(endpointDef.quota, plan.quota);
                  const effectiveWorkload = resolveEffectiveWorkload(endpointDef.workload);

                  const aliases = extractAliases(endpointDef);
                  const hasAliases = aliases.length > 0;
                  const hasEffectiveMetrics =
                    effectiveRateEntries.length > 0 || effectiveQuotaEntries.length > 0 || effectiveWorkload != null;

                  return (
                    <td key={planKey} className="p-0 py-1 align-top">
                      <div
                        className="border rounded-lg h-full relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                          borderColor: '#DFE3E8',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = alpha(planColor, 0.5);
                          (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${alpha(planColor, 0.08)}`;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#DFE3E8';
                          (e.currentTarget as HTMLElement).style.boxShadow = '';
                        }}
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px]"
                          style={{ backgroundColor: alpha(planColor, 0.6) }}
                        />
                        <div className="p-5 pl-6">
                          <div className="mb-4">
                            <span
                              className="inline-block font-mono font-semibold text-[0.8rem] rounded-xl px-3 py-1 break-all"
                              style={{ color: planColor, backgroundColor: alpha(planColor, 0.1) }}
                            >
                              {endpoint}
                            </span>
                          </div>

                          {hasEffectiveMetrics && (
                            <div className={`flex flex-col ${hasAliases ? 'mb-4' : ''}`}>
                              {effectiveRateEntries.length > 0 && (
                                <MetricRow
                                  label="Rate Limit"
                                  value={renderMetricEntries(effectiveRateEntries, datasheet.maxPower, false, warningColor)}
                                />
                              )}
                              {effectiveQuotaEntries.length > 0 && (
                                <MetricRow
                                  label="Quota"
                                  value={renderMetricEntries(effectiveQuotaEntries, datasheet.capacity, false, infoColor)}
                                />
                              )}
                              {effectiveWorkload && (
                                <MetricRow
                                  label="CRF"
                                  value={renderCrfValue(effectiveWorkload)}
                                />
                              )}
                            </div>
                          )}

                          {hasAliases && (
                            <div
                              className={`flex flex-col gap-4 ${hasEffectiveMetrics ? 'pt-4 border-t border-dashed border-[#DFE3E8]' : ''}`}
                            >
                              {aliases.map(([aliasName, aliasValues]) => {
                                const aliasEffectiveRateEntries = resolveMetricEntries(
                                  aliasValues.rate,
                                  endpointDef.rate ?? plan.rate
                                );
                                const aliasEffectiveQuotaEntries = resolveMetricEntries(
                                  aliasValues.quota,
                                  endpointDef.quota ?? plan.quota
                                );
                                const aliasEffectiveWorkload = resolveEffectiveWorkload(aliasValues.workload);
                                const hasAliasMetrics =
                                  aliasEffectiveRateEntries.length > 0 ||
                                  aliasEffectiveQuotaEntries.length > 0 ||
                                  aliasEffectiveWorkload != null;

                                return (
                                  <div
                                    key={aliasName}
                                    className="pl-3 border-l-2"
                                    style={{ borderColor: alpha(planColor, 0.3) }}
                                  >
                                    <div className={hasAliasMetrics ? 'mb-3' : ''}>
                                      <span
                                        className="inline-block font-mono font-semibold text-[0.75rem] rounded px-2 py-0.5 break-all text-[#637381]"
                                        style={{ backgroundColor: alpha('#637381', 0.08) }}
                                      >
                                        {aliasName}
                                      </span>
                                    </div>
                                    {hasAliasMetrics && (
                                      <div className="flex flex-col">
                                        {aliasEffectiveRateEntries.length > 0 && (
                                          <MetricRow
                                            label="Rate Limit"
                                            value={renderMetricEntries(aliasEffectiveRateEntries, datasheet.maxPower, false, warningColor)}
                                          />
                                        )}
                                        {aliasEffectiveQuotaEntries.length > 0 && (
                                          <MetricRow
                                            label="Quota"
                                            value={renderMetricEntries(aliasEffectiveQuotaEntries, datasheet.capacity, false, infoColor)}
                                          />
                                        )}
                                        {aliasEffectiveWorkload && (
                                          <MetricRow
                                            label="CRF"
                                            value={renderCrfValue(aliasEffectiveWorkload)}
                                          />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
