import { Helmet } from 'react-helmet';
import { useEffect, useState } from 'react';
import { Box, Container, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Pricing, retrievePricingFromYaml } from 'pricing4ts';
import DatasheetFileExplorer from '../../components/file-explorer';
import { AnalyticsDataEntry } from '../../../../assets/data/analytics';
import { usePathname } from '../../../core/hooks/usePathname';
import { useQueryParams } from '../../../core/hooks/useQueryParams';
import customAlert from '../../../core/utils/custom-alert';
import DatasheetRenderer from '../../components/datasheet-renderer';
import { DatasheetModel } from '../../types/datasheetTypes';

interface DatasheetResponse {
  name: string;
  versions: Array<{
    _id?: string;
    owner?: string;
    collectionName?: string;
    private?: boolean;
    _collectionId?: string;
    version?: string;
    extractionDate: string;
    currency?: string;
    yaml: string;
    analytics?: Record<string, unknown>;
  }>;
}

function resolveDatasheetYamlUrl(yamlPath: string) {
  if (/^https?:\/\//i.test(yamlPath)) {
    try {
      const parsedUrl = new URL(yamlPath);
      if (parsedUrl.pathname.startsWith('/public/')) {
        parsedUrl.pathname = parsedUrl.pathname.replace('/public/', '/');
      }
      return parsedUrl.toString();
    } catch {
      return yamlPath;
    }
  }

  const normalizedYamlPath = yamlPath.startsWith('/public/')
    ? yamlPath.replace('/public/', '/')
    : yamlPath.startsWith('public/')
    ? yamlPath.replace('public/', '')
    : yamlPath;

  if (normalizedYamlPath.startsWith('/')) {
    return `${import.meta.env.VITE_API_URL}${normalizedYamlPath}`;
  }

  return `${import.meta.env.VITE_API_URL}/${normalizedYamlPath}`;
}

function normalizeDatasheetShape(parsedYaml: Record<string, unknown>): DatasheetModel {
  return {
    saasName:
      (parsedYaml.saasName as string | undefined) ||
      (parsedYaml.associated_saas as string | undefined) ||
      'Unknown SaaS',
    type: (parsedYaml.type as string | undefined) || 'partial_saas',
    sourceUrl:
      (parsedYaml.sourceUrl as string | undefined) ||
      (parsedYaml.source_url as string | undefined) ||
      (parsedYaml.url as string | undefined) ||
      '',
    syntaxVersion:
      (parsedYaml.syntaxVersion as string | undefined) ||
      (parsedYaml.syntax_version as string | undefined) ||
      '',
    date: (parsedYaml.date as string | undefined) || '',
    currency: parsedYaml.currency as string | undefined,
    consumptionUnits:
      (parsedYaml.consumptionUnits as string[] | undefined) ||
      (parsedYaml.consumption_units as string[] | undefined),
    capacity: (parsedYaml.capacity as Record<string, unknown>) || {},
    maxPower:
      (parsedYaml.maxPower as Record<string, unknown>) ||
      (parsedYaml.max_power as Record<string, unknown>) ||
      {},
    plans: (parsedYaml.plans as Record<string, unknown>) || {},
  } as DatasheetModel;
}

export default function DatasheetCardPage() {
  const [tabValue, setTabValue] = useState(0);
  const [fullDatasheetData, setFullDatasheetData] = useState<AnalyticsDataEntry[] | null>(null);
  const [datasheetData, setDatasheetData] = useState<AnalyticsDataEntry[] | null>(null);
  const [currentDatasheet, setCurrentDatasheet] = useState<AnalyticsDataEntry | null>(null);
  const [datasheet, setDatasheet] = useState<Pricing | DatasheetModel | null>(null);
  const [datasheetError, setDatasheetError] = useState<string | null>(null);
  const [oldestDatasheetDate, setOldestDatasheetDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const queryParams = useQueryParams();
  const pathSegments = pathname.split('/');
  const datasheetName = pathSegments[pathSegments.length - 1] as string;
  const datasheetOwner = pathSegments[pathSegments.length - 2] as string;

  useEffect(() => {
    const fetchDatasheet = async () => {
      try {
        setLoading(true);
        const collectionName = queryParams.get('collectionName');
        const collectionQuery =
          collectionName && collectionName !== 'undefined'
            ? `?collectionName=${encodeURIComponent(collectionName)}`
            : '';

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/datasheets/${datasheetOwner}/${datasheetName}${collectionQuery}`
        );
        
        if (!response.ok) {
          throw new Error('Datasheet not found');
        }

        const data = (await response.json()) as DatasheetResponse;
        
        if (data.versions && data.versions.length > 0) {
          const transformedVersions = data.versions.map((v, idx) => {
            const apiAnalytics = v.analytics as Record<string, unknown> | undefined;
            const entry = {
              id: v._id || `${datasheetName}-v${idx}`,
              name: data.name,
              owner: {
                id: v.owner || 'unknown',
                username: datasheetOwner,
              },
              collectionName: v.collectionName || '',
              private: v.private || false,
              _collectionId: v._collectionId || '',
              collection: v._collectionId || '',
              version: v.version || `v${idx + 1}`,
              extractionDate: v.extractionDate,
              currency: v.currency || 'USD',
              yaml: v.yaml,
              analytics: {
                numberOfFeatures: (apiAnalytics?.numberOfFeatures as number) || 0,
                numberOfInformationFeatures: (apiAnalytics?.numberOfInformationFeatures as number) || 0,
                numberOfIntegrationFeatures: (apiAnalytics?.numberOfIntegrationFeatures as number) || 0,
                numberOfIntegrationApiFeatures: (apiAnalytics?.numberOfIntegrationApiFeatures as number) || 0,
                numberOfIntegrationExtensionFeatures: (apiAnalytics?.numberOfIntegrationExtensionFeatures as number) || 0,
                numberOfIntegrationIdentityProviderFeatures: (apiAnalytics?.numberOfIntegrationIdentityProviderFeatures as number) || 0,
                numberOfIntegrationWebSaaSFeatures: (apiAnalytics?.numberOfIntegrationWebSaaSFeatures as number) || 0,
                numberOfIntegrationMarketplaceFeatures: (apiAnalytics?.numberOfIntegrationMarketplaceFeatures as number) || 0,
                numberOfIntegrationExternalDeviceFeatures: (apiAnalytics?.numberOfIntegrationExternalDeviceFeatures as number) || 0,
                numberOfDomainFeatures: (apiAnalytics?.numberOfDomainFeatures as number) || 0,
                numberOfAutomationFeatures: (apiAnalytics?.numberOfAutomationFeatures as number) || 0,
                numberOfBotAutomationFeatures: (apiAnalytics?.numberOfBotAutomationFeatures as number) || 0,
                numberOfFilteringAutomationFeatures: (apiAnalytics?.numberOfFilteringAutomationFeatures as number) || 0,
                numberOfTrackingAutomationFeatures: (apiAnalytics?.numberOfTrackingAutomationFeatures as number) || 0,
                numberOfTaskAutomationFeatures: (apiAnalytics?.numberOfTaskAutomationFeatures as number) || 0,
                numberOfManagementFeatures: (apiAnalytics?.numberOfManagementFeatures as number) || 0,
                numberOfGuaranteeFeatures: (apiAnalytics?.numberOfGuaranteeFeatures as number) || 0,
                numberOfSupportFeatures: (apiAnalytics?.numberOfSupportFeatures as number) || 0,
                numberOfPaymentFeatures: (apiAnalytics?.numberOfPaymentFeatures as number) || 0,
                numberOfUsageLimits: (apiAnalytics?.numberOfUsageLimits as number) || 0,
                numberOfRenewableUsageLimits: (apiAnalytics?.numberOfRenewableUsageLimits as number) || 0,
                numberOfNonRenewableUsageLimits: (apiAnalytics?.numberOfNonRenewableUsageLimits as number) || 0,
                numberOfResponseDrivenUsageLimits: (apiAnalytics?.numberOfResponseDrivenUsageLimits as number) || 0,
                numberOfTimeDrivenUsageLimits: (apiAnalytics?.numberOfTimeDrivenUsageLimits as number) || 0,
                numberOfPlans: (apiAnalytics?.numberOfPlans as number) || 0,
                numberOfFreePlans: (apiAnalytics?.numberOfFreePlans as number) || 0,
                numberOfPaidPlans: (apiAnalytics?.numberOfPaidPlans as number) || 0,
                numberOfAddOns: (apiAnalytics?.numberOfAddOns as number) || 0,
                numberOfReplacementAddons: (apiAnalytics?.numberOfReplacementAddons as number) || 0,
                numberOfExtensionAddons: (apiAnalytics?.numberOfExtensionAddons as number) || 0,
                configurationSpaceSize: (apiAnalytics?.configurationSpaceSize as number) || 0,
                minSubscriptionPrice: (apiAnalytics?.minSubscriptionPrice as number) || 0,
                maxSubscriptionPrice: (apiAnalytics?.maxSubscriptionPrice as number) || 0,
              },
            };
            return entry as AnalyticsDataEntry;
          });

          const latestVersion = transformedVersions[0];
          const oldestVersion = transformedVersions[transformedVersions.length - 1];
          
          setFullDatasheetData(transformedVersions);
          setDatasheetData(transformedVersions);
          setCurrentDatasheet(latestVersion);
          setOldestDatasheetDate(oldestVersion.extractionDate);
        } else {
          throw new Error('No datasheet versions found');
        }
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Error loading datasheet';
        customAlert(errorMsg);
        setFullDatasheetData([]);
        setDatasheetData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasheet();
  }, [datasheetName, datasheetOwner, queryParams]);

  useEffect(() => {
    if (!currentDatasheet) {
      return;
    }

    const fetchYaml = async () => {
      setDatasheet(null);
      setDatasheetError(null);

      try {
        const yamlUrl = resolveDatasheetYamlUrl(currentDatasheet.yaml);
        const response = await fetch(yamlUrl);
        
        if (!response.ok) {
          throw new Error('Could not fetch datasheet YAML');
        }

        const rawYaml = await response.text();

        try {
          const parsed = retrievePricingFromYaml(rawYaml);
          setDatasheet(parsed);
        } catch {
          try {
            const YAMLModule = await import('yaml');
            const parseYaml =
              (YAMLModule.parse as ((text: string) => Record<string, unknown>) | undefined) ||
              (YAMLModule.default?.parse as
                | ((text: string) => Record<string, unknown>)
                | undefined);

            if (!parseYaml) {
              throw new Error('YAML parser is not available');
            }

            const parsedYaml = parseYaml(rawYaml);
            setDatasheet(normalizeDatasheetShape(parsedYaml));
          } catch (yamlError: unknown) {
            const err = yamlError instanceof Error ? yamlError.message : String(yamlError);
            setDatasheetError(`Could not parse datasheet: ${err}`);
          }
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error.message : String(error);
        setDatasheetError(err);
      }
    };

    fetchYaml();
  }, [currentDatasheet]);

  const handleInputDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newData = fullDatasheetData?.filter(
      entry => new Date(entry.extractionDate) >= new Date(e.target.value)
    );

    if (newData) {
      setDatasheetData(newData);
    } else {
      setDatasheetData([]);
    }
  };

  const handleOutputDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newData = fullDatasheetData?.filter(
      entry => new Date(entry.extractionDate) <= new Date(e.target.value)
    );

    if (newData) {
      setDatasheetData(newData);
    } else {
      setDatasheetData([]);
    }
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedVersion = datasheetData?.find(entry => entry.yaml === e.target.value);
    if (selectedVersion) {
      setCurrentDatasheet(selectedVersion);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography>Loading datasheet...</Typography>
        </Box>
      </Container>
    );
  }

  const datasheetNameDisplay = ((datasheet as Record<string, unknown> | undefined)?.saasName as string) || datasheetName;

  return (
    <>
      <Helmet>
        <title>{`SPHERE - ${datasheetNameDisplay} Datasheet`}</title>
      </Helmet>

      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" flexDirection="column">
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h5" letterSpacing={1}>
                  {datasheetNameDisplay}
                </Typography>
              </Box>

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_event, value) => setTabValue(value)}>
                  <Tab label="Datasheet card" />
                  <Tab label="Files and versions" />
                </Tabs>
              </Box>
            </Box>

            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" gap={2}>
                {oldestDatasheetDate && (
                  <>
                    <TextField
                      label="Start Date"
                      type="date"
                      fullWidth
                      defaultValue={new Date(oldestDatasheetDate).toISOString().split('T')[0]}
                      slotProps={{ inputLabel: { shrink: true } }}
                      onChange={handleInputDate}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      fullWidth
                      slotProps={{ inputLabel: { shrink: true } }}
                      onChange={handleOutputDate}
                    />
                  </>
                )}
              </Box>

              <TextField
                label="Version"
                select
                fullWidth
                slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                onChange={handleVersionChange}
              >
                {datasheetData?.map((entry, index) => {
                  const yamlParts = entry.yaml.split('/');
                  const yamlFileName = yamlParts[yamlParts.length - 1]
                    .replace('.yaml', '')
                    .replace('.yml', '');
                  return (
                    <option key={index} value={entry.yaml}>
                      {yamlFileName}
                    </option>
                  );
                })}
              </TextField>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          {tabValue === 1 && datasheetData && (
            <DatasheetFileExplorer datasheetData={datasheetData} />
          )}

          {tabValue === 0 && (
            <Box flex={1}>
              <Typography variant="h6" gutterBottom>
                Datasheet information
              </Typography>
              <Typography variant="body1" sx={{ mb: 4 }}>
                This is the datasheet information for {datasheetNameDisplay}. The version currently
                displayed is from{' '}
                {currentDatasheet?.extractionDate
                  ? new Date(currentDatasheet.extractionDate).toLocaleDateString()
                  : 'unknown date'}
                .
              </Typography>

              {datasheet && (datasheet as Record<string, unknown>).plans ? (
                <DatasheetRenderer datasheet={datasheet as DatasheetModel} />
              ) : datasheet ? (
                <Typography>Pricing datasheet format detected</Typography>
              ) : (
                <Typography color="error">{datasheetError || 'Could not parse datasheet'}</Typography>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
}
