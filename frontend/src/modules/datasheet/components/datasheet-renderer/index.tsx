import React from 'react';
import { motion } from 'framer-motion';
import {
  DatasheetEndpoint,
  DatasheetMetric,
  DatasheetModel,
  DatasheetPlan,
  DatasheetPlanAlias,
  DatasheetPeriod,
  DatasheetWorkload,
} from '../../types/datasheetTypes';

const SHARED_ENDPOINT_KEY = '/*';

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

function getSharedEndpoint(plan?: DatasheetPlan): DatasheetEndpoint | undefined {
  return plan?.endpoints?.[SHARED_ENDPOINT_KEY];
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

function formatMetricList(
  keys: string[],
  store?: Record<string, DatasheetMetric>,
  compact = false
): React.ReactNode {
  if (!store || keys.length === 0) return 'Not defined';
  if (keys.length === 1) return renderMetricValue(store[keys[0]], compact);
  return (
    <div className="flex flex-col gap-2">
      {keys.map((key, i) => (
        <div key={i}>{renderMetricValue(store[key], compact)}</div>
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

function resolveEffectiveMetricKeys(
  endpointValue?: string | string[],
  sharedEndpointValue?: string | string[],
  planValue?: string | string[]
): { keys: string[]; source: 'endpoint' | 'plan' | null } {
  const endpointKeys = resolveMetricKeys(endpointValue);
  if (endpointKeys.length > 0) return { keys: endpointKeys, source: null };

  const sharedEndpointKeys = resolveMetricKeys(sharedEndpointValue);
  if (sharedEndpointKeys.length > 0) return { keys: sharedEndpointKeys, source: 'endpoint' };

  const planKeys = resolveMetricKeys(planValue);
  if (planKeys.length > 0) return { keys: planKeys, source: 'plan' };

  return { keys: [], source: null };
}

function resolveEffectiveWorkload(
  endpointWorkload?: DatasheetEndpoint['workload'],
  sharedEndpointWorkload?: DatasheetEndpoint['workload']
) {
  return endpointWorkload ?? sharedEndpointWorkload;
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

export default function DatasheetRenderer({ datasheet }: { datasheet: DatasheetModel }) {
  const planKeys = Object.keys(datasheet.plans);

  const allEndpoints = new Set<string>();
  planKeys.forEach(planKey => {
    const planEndpoints = datasheet.plans[planKey]?.endpoints || {};
    Object.keys(planEndpoints)
      .filter(ep => ep !== SHARED_ENDPOINT_KEY)
      .forEach(ep => allEndpoints.add(ep));
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
                      <div className="mt-4 flex flex-col gap-2">
                        {resolveMetricKeys(datasheet.plans[planKey].quota).map((key, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#637381]" />
                            <div className="text-xs text-[#637381] font-medium">
                              Quota:{' '}
                              <span className="text-[#212B36] font-semibold inline-block align-top">
                                {renderMetricValue(datasheet.capacity?.[key], true)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {resolveMetricKeys(datasheet.plans[planKey].rate).map((key, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#637381]" />
                            <div className="text-xs text-[#637381] font-medium">
                              Rate:{' '}
                              <span className="text-[#212B36] font-semibold inline-block align-top">
                                {renderMetricValue(datasheet.maxPower?.[key], true)}
                              </span>
                            </div>
                          </div>
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
                  const sharedEndpointDef = getSharedEndpoint(plan);
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

                  const effectiveRate = resolveEffectiveMetricKeys(endpointDef.rate, sharedEndpointDef?.rate, plan.rate);
                  const effectiveQuota = resolveEffectiveMetricKeys(endpointDef.quota, sharedEndpointDef?.quota, plan.quota);
                  const effectiveWorkload = resolveEffectiveWorkload(endpointDef.workload, sharedEndpointDef?.workload);

                  const aliases = extractAliases(endpointDef);
                  const hasAliases = aliases.length > 0;
                  const hasEffectiveMetrics =
                    effectiveRate.keys.length > 0 || effectiveQuota.keys.length > 0 || effectiveWorkload != null;

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
                              {effectiveRate.keys.length > 0 && (
                                <MetricRow
                                  label="Rate Limit"
                                  value={
                                    effectiveRate.source ? (
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span>{formatMetricList(effectiveRate.keys, datasheet.maxPower)}</span>
                                        <SharedBadge level={effectiveRate.source} color={warningColor} />
                                      </div>
                                    ) : formatMetricList(effectiveRate.keys, datasheet.maxPower)
                                  }
                                />
                              )}
                              {effectiveQuota.keys.length > 0 && (
                                <MetricRow
                                  label="Quota"
                                  value={
                                    effectiveQuota.source ? (
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span>{formatMetricList(effectiveQuota.keys, datasheet.capacity)}</span>
                                        <SharedBadge level={effectiveQuota.source} color={infoColor} />
                                      </div>
                                    ) : formatMetricList(effectiveQuota.keys, datasheet.capacity)
                                  }
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
                                const aliasEffectiveRate = resolveEffectiveMetricKeys(
                                  aliasValues.rate,
                                  endpointDef.rate ?? sharedEndpointDef?.rate,
                                  plan.rate
                                );
                                const aliasEffectiveQuota = resolveEffectiveMetricKeys(
                                  aliasValues.quota,
                                  endpointDef.quota ?? sharedEndpointDef?.quota,
                                  plan.quota
                                );
                                const aliasEffectiveWorkload = resolveEffectiveWorkload(
                                  aliasValues.workload,
                                  endpointDef.workload ?? sharedEndpointDef?.workload
                                );
                                const hasAliasMetrics =
                                  aliasEffectiveRate.keys.length > 0 ||
                                  aliasEffectiveQuota.keys.length > 0 ||
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
                                        {aliasEffectiveRate.keys.length > 0 && (
                                          <MetricRow
                                            label="Rate Limit"
                                            value={
                                              aliasEffectiveRate.source ? (
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span>{formatMetricList(aliasEffectiveRate.keys, datasheet.maxPower)}</span>
                                                  <SharedBadge level={aliasEffectiveRate.source} color={warningColor} />
                                                </div>
                                              ) : formatMetricList(aliasEffectiveRate.keys, datasheet.maxPower)
                                            }
                                          />
                                        )}
                                        {aliasEffectiveQuota.keys.length > 0 && (
                                          <MetricRow
                                            label="Quota"
                                            value={
                                              aliasEffectiveQuota.source ? (
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span>{formatMetricList(aliasEffectiveQuota.keys, datasheet.capacity)}</span>
                                                  <SharedBadge level={aliasEffectiveQuota.source} color={infoColor} />
                                                </div>
                                              ) : formatMetricList(aliasEffectiveQuota.keys, datasheet.capacity)
                                            }
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
