import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  DatasheetEndpoint,
  DatasheetMetric,
  DatasheetMockModel,
  DatasheetPeriod,
} from '../../mocks/vimeoMock';

function formatMetric(metric?: DatasheetMetric) {
  if (!metric) return 'Not defined';
  const period =
    typeof metric.period === 'string'
      ? metric.period
      : `${metric.period.value} ${metric.period.unit}`;
  return `${metric.value} ${metric.unit} / ${period}`;
}

function formatPrice(value: string | number) {
  if (typeof value === 'number') {
    if (value === 0) return 'FREE';
    return `$${value}`;
  }
  return String(value).toUpperCase();
}

function formatPlanPeriod(period?: DatasheetPeriod, legacyBillingPeriod?: string) {
  if (period) {
    return `${period.value} ${period.unit}`;
  }
  if (legacyBillingPeriod) {
    return legacyBillingPeriod;
  }
  return 'Not defined';
}

function extractAliases(endpoint: DatasheetEndpoint): Array<[string, { rate?: string; quota?: string }]> {
  return Object.entries(endpoint).filter(([key, value]) => {
    if (key === 'rate' || key === 'quota' || key === 'workload') return false;
    return typeof value === 'object' && value !== null;
  }) as Array<[string, { rate?: string; quota?: string }]>;
}

const getPlanGradient = (index: number): string => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ];
  return gradients[index % gradients.length];
};

export default function MockDatasheetRenderer({ datasheet }: { datasheet: DatasheetMockModel }) {
  const planKeys = Object.keys(datasheet.plans);
  
  // Collect all unique endpoint paths across all plans
  const allEndpoints = new Set<string>();
  planKeys.forEach(planKey => {
    Object.keys(datasheet.plans[planKey].endpoints).forEach(endpoint => {
      allEndpoints.add(endpoint);
    });
  });
  const endpointList = Array.from(allEndpoints).sort();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          {datasheet.saasName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Source: {datasheet.sourceUrl}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Syntax version: {datasheet.syntaxVersion} · Date: {datasheet.date}
        </Typography>
      </Paper>

      {/* Endpoints Comparison Table - Pricing Style */}
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Endpoint</TableCell>
              {planKeys.map((planKey, idx) => (
                <TableCell
                  key={planKey}
                  align="center"
                  sx={{
                    background: getPlanGradient(idx),
                    color: '#fff',
                    fontWeight: 'bolder',
                    minWidth: 180,
                    fontSize: 18,
                    py: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: 20 }}>
                    {planKey.toUpperCase()}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                    {formatPrice(datasheet.plans[planKey].price)}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 14, opacity: 0.95 }}>
                    {formatPlanPeriod(datasheet.plans[planKey].period, datasheet.plans[planKey].billingPeriod)}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {endpointList.map((endpoint, endIdx) => (
              <motion.tr
                key={endpoint}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + endIdx * 0.02 }}
                style={{ display: 'table-row' }}
              >
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ fontWeight: 600, fontSize: 15, verticalAlign: 'top' }}
                >
                  {endpoint}
                </TableCell>
                {planKeys.map(planKey => {
                  const plan = datasheet.plans[planKey];
                  const endpointDef = plan.endpoints[endpoint] as DatasheetEndpoint | undefined;

                  if (!endpointDef) {
                    return (
                      <TableCell key={planKey} align="center" sx={{ verticalAlign: 'top' }}>
                        <Typography sx={{ color: '#9ca3af', fontWeight: 500 }}>—</Typography>
                      </TableCell>
                    );
                  }

                  const aliases = extractAliases(endpointDef);
                  const hasAliases = aliases.length > 0;

                  return (
                    <TableCell
                      key={planKey}
                      align="left"
                      sx={{
                        verticalAlign: 'top',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        px: 2,
                      }}
                    >
                      {!hasAliases && (
                        <Box>
                          {endpointDef.rate && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                <strong>Rate:</strong>
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '0.85rem',
                                  color: '#555',
                                  fontWeight: 500,
                                }}
                              >
                                {formatMetric(datasheet.maxPower[endpointDef.rate])}
                              </Typography>
                            </Box>
                          )}
                          {endpointDef.quota && (
                            <Box>
                              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                <strong>Quota:</strong>
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '0.85rem',
                                  color: '#555',
                                  fontWeight: 500,
                                }}
                              >
                                {formatMetric(datasheet.capacity[endpointDef.quota])}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {hasAliases && (
                        <Box>
                          {aliases.map(([aliasName, aliasValues], aliasIdx) => (
                            <Box
                              key={aliasName}
                              sx={{
                                mb: aliasIdx < aliases.length - 1 ? 1.5 : 0,
                                pb: aliasIdx < aliases.length - 1 ? 1 : 0,
                                borderBottom:
                                  aliasIdx < aliases.length - 1 ? '1px solid #eee' : 'none',
                              }}
                            >
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  color: '#333',
                                  fontSize: '0.9rem',
                                  mb: 0.5,
                                }}
                              >
                                {aliasName}
                              </Typography>
                              {aliasValues.rate && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: '0.8rem',
                                    color: '#666',
                                    ml: 1,
                                    mb: 0.3,
                                  }}
                                >
                                  <strong>Rate:</strong> {formatMetric(datasheet.maxPower[aliasValues.rate])}
                                </Typography>
                              )}
                              {aliasValues.quota && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: '0.8rem',
                                    color: '#666',
                                    ml: 1,
                                  }}
                                >
                                  <strong>Quota:</strong> {formatMetric(datasheet.capacity[aliasValues.quota])}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
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
