import {
  Box,
  Card,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  DatasheetEndpoint,
  DatasheetMetric,
  DatasheetModel,
  DatasheetPlanAlias,
  DatasheetPeriod,
} from '../../types/datasheetTypes';

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

function formatPrice(value: string | number) {
  if (typeof value === 'number') {
    return value === 0 ? '$0' : `$${value}`;
  }

  const normalizedNumber = Number(value);
  if (!Number.isNaN(normalizedNumber)) {
    return normalizedNumber === 0 ? '$0' : `$${normalizedNumber}`;
  }

  return String(value).toUpperCase();
}

function formatPlanPeriod(period?: DatasheetPeriod, legacyBillingPeriod?: string) {
  if (period) {
    if (period.value === 1 && String(period.unit).toUpperCase() === 'MONTH') {
      return 'month';
    }
    return period.value === 1 ? String(period.unit).toLowerCase() : `${period.value} ${String(period.unit).toLowerCase()}`;
  }
  if (legacyBillingPeriod) {
    if (legacyBillingPeriod.trim().toUpperCase() === '1 MONTH') {
      return 'month';
    }
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

function formatWorkloadText(workload?: DatasheetEndpoint['workload']) {
  if (!workload) return 'Not defined';
  return `${workload.min} - ${workload.max} ${String(workload.unit).toLowerCase()}`;
}

function formatUnifiedRoute(endpoint: string, alias?: string) {
  const normalizedEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
  if (!alias) return normalizedEndpoint;
  const normalizedAlias = alias.replace(/^\/+|\/+$/g, '');
  if (!normalizedEndpoint) return normalizedAlias;
  return `${normalizedEndpoint}/${normalizedAlias}`;
}

function getPlanColor(index: number, theme: any) {
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    '#E91E63', // Pink
    '#9C27B0', // Deep Purple
    '#673AB7', // Indigo
  ];
  return colors[index % colors.length] || theme.palette.primary.main;
}

const MetricRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0.2,
      py: 0.8,
      borderBottom: '1px dashed',
      borderColor: 'divider',
      '&:last-child': { borderBottom: 'none' },
    }}
  >
    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', fontSize: '0.85rem' }}>
      {value}
    </Typography>
  </Box>
);

export default function DatasheetRenderer({ datasheet }: { datasheet: DatasheetModel }) {
  const theme = useTheme();
  const planKeys = Object.keys(datasheet.plans);
  
  // Collect all unique endpoint paths across all plans
  const allEndpoints = new Set<string>();
  planKeys.forEach(planKey => {
    const planEndpoints = datasheet.plans[planKey]?.endpoints || {};
    Object.keys(planEndpoints).forEach(endpoint => {
      allEndpoints.add(endpoint);
    });
  });
  const endpointList = Array.from(allEndpoints).sort();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="h5" fontWeight={800} color="text.primary">
          {datasheet.saasName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Source: <a href={datasheet.sourceUrl || '#'} target="_blank" rel="noreferrer" style={{ color: theme.palette.primary.main, textDecoration: 'none' }}>{datasheet.sourceUrl || 'Not defined'}</a>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            v{datasheet.syntaxVersion} · {datasheet.date}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ overflowX: 'auto', pb: 2 }}>
        <Table sx={{ minWidth: 800, borderCollapse: 'separate', borderSpacing: '12px 0' }}>
          <TableHead>
            <TableRow>
              {planKeys.map((planKey, idx) => {
                const planColor = getPlanColor(idx, theme);
                return (
                  <TableCell
                    key={planKey}
                    align="left"
                    sx={{
                      borderBottom: 'none',
                      p: 0,
                      width: `${100 / planKeys.length}%`,
                      minWidth: 260,
                      verticalAlign: 'top'
                    }}
                  >
                    <Card
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: alpha(planColor, 0.3),
                        borderTop: `4px solid ${planColor}`,
                        bgcolor: alpha(planColor, 0.02),
                        borderRadius: 2,
                        p: 3,
                        mb: 2,
                        height: '100%'
                      }}
                    >
                      <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: planColor, textTransform: 'capitalize', mb: 1 }}>
                        {planKey}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1 }}>
                          {formatPrice(datasheet.plans[planKey].price)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          / {formatPlanPeriod(datasheet.plans[planKey].period, datasheet.plans[planKey].billingPeriod)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {datasheet.plans[planKey].quota && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                              Quota: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{formatMetric(datasheet.capacity?.[datasheet.plans[planKey].quota])}</Box>
                            </Typography>
                          </Box>
                        )}
                        {datasheet.plans[planKey].rate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                              Rate: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{formatMetric(datasheet.maxPower?.[datasheet.plans[planKey].rate])}</Box>
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Card>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
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
                  const endpointDef = plan?.endpoints?.[endpoint] as DatasheetEndpoint | undefined;
                  const planColor = getPlanColor(idx, theme);

                  if (!endpointDef) {
                    return (
                      <TableCell key={planKey} sx={{ borderBottom: 'none', px: 0, py: 1 }}>
                        <Card elevation={0} sx={{ border: '1px dashed', borderColor: 'divider', bgcolor: 'transparent', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
                          <Typography sx={{ color: 'text.disabled', fontWeight: 500 }}>Not available</Typography>
                        </Card>
                      </TableCell>
                    );
                  }

                  const aliases = extractAliases(endpointDef);
                  const hasAliases = aliases.length > 0;

                  return (
                    <TableCell key={planKey} sx={{ borderBottom: 'none', px: 0, py: 1, verticalAlign: 'top' }}>
                      <Card
                        elevation={0}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          height: '100%',
                          transition: 'all 0.2s ease-in-out',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            borderColor: alpha(planColor, 0.5),
                            boxShadow: `0 4px 20px ${alpha(planColor, 0.08)}`,
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        {/* Subtle left accent bar */}
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, bgcolor: alpha(planColor, 0.6) }} />
                        
                        <Box sx={{ p: 2.5, pl: 3 }}>
                          <Box sx={{ mb: 2 }}>
                            <Typography sx={{ display: 'inline-block', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', color: planColor, bgcolor: alpha(planColor, 0.1), borderRadius: 1.5, px: 1.5, py: 0.5, wordBreak: 'break-all' }}>
                              {endpoint}
                            </Typography>
                          </Box>

                          {(endpointDef.rate || endpointDef.quota || endpointDef.workload) && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', mb: hasAliases ? 2 : 0 }}>
                              {endpointDef.rate && <MetricRow label="Rate Limit" value={formatMetric(datasheet.maxPower[endpointDef.rate])} />}
                              {endpointDef.quota && <MetricRow label="Quota" value={formatMetric(datasheet.capacity[endpointDef.quota])} />}
                              {endpointDef.workload && (
                                <MetricRow 
                                  label="Workload" 
                                  value={
                                    <Box>
                                      {formatWorkloadText(endpointDef.workload)}
                                      {endpointDef.workload.description && (
                                        <Typography sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
                                          {endpointDef.workload.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  } 
                                />
                              )}
                            </Box>
                          )}

                          {hasAliases && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: (endpointDef.rate || endpointDef.quota || endpointDef.workload) ? 2 : 0, borderTop: (endpointDef.rate || endpointDef.quota || endpointDef.workload) ? '1px dashed' : 'none', borderColor: 'divider' }}>
                              {aliases.map(([aliasName, aliasValues], aliasIdx) => {
                                const hasAliasMetrics = aliasValues.rate || aliasValues.quota || aliasValues.workload;
                                return (
                                  <Box key={aliasName} sx={{ pl: 1.5, borderLeft: '2px solid', borderColor: alpha(planColor, 0.3) }}>
                                    <Box sx={{ mb: hasAliasMetrics ? 1.5 : 0 }}>
                                      <Typography sx={{ display: 'inline-block', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', bgcolor: alpha(theme.palette.text.secondary, 0.08), borderRadius: 1, px: 1, py: 0.3, wordBreak: 'break-all' }}>
                                        {aliasName}
                                      </Typography>
                                    </Box>
                                    
                                    {hasAliasMetrics && (
                                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        {aliasValues.rate && (
                                          <MetricRow label="Rate Limit" value={formatMetric(datasheet.maxPower[aliasValues.rate as string])} />
                                        )}
                                        {aliasValues.quota && (
                                          <MetricRow label="Quota" value={formatMetric(datasheet.capacity[aliasValues.quota as string])} />
                                        )}
                                        {aliasValues.workload && (
                                          <MetricRow 
                                            label="Workload" 
                                            value={
                                              <Box>
                                                {formatWorkloadText(aliasValues.workload)}
                                                {aliasValues.workload.description && (
                                                  <Typography sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
                                                    {aliasValues.workload.description}
                                                  </Typography>
                                                )}
                                              </Box>
                                            } 
                                          />
                                        )}
                                      </Box>
                                    )}
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                        </Box>
                      </Card>
                    </TableCell>
                  );
                })}
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
