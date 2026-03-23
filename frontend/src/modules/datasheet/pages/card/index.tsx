import { Helmet } from 'react-helmet';
import { useEffect, useState } from 'react';
import { Box, Container, Tab, Tabs, TextField, Typography } from '@mui/material';
import { PricingRenderer } from '../../../pricing-editor/components/pricing-renderer';
import { Pricing, retrievePricingFromYaml } from 'pricing4ts';
import FileExplorer from '../../../pricing/components/file-explorer';
import { AnalyticsDataEntry } from '../../../../assets/data/analytics';
import { usePathname } from '../../../core/hooks/usePathname';
import { usePricingsApi } from '../../../pricing/api/pricingsApi';
import customAlert from '../../../core/utils/custom-alert';
import MockDatasheetRenderer from '../../components/mock-datasheet-renderer';
import { VIMEO_MOCK_DATASHEET, VIMEO_MOCK_VERSION_ENTRY } from '../../mocks/vimeoMock';

export default function DatasheetCardPage() {
  const [tabValue, setTabValue] = useState(0);
  const [fullDatasheetData, setFullDatasheetData] = useState<AnalyticsDataEntry[] | null>(null);
  const [datasheetData, setDatasheetData] = useState<AnalyticsDataEntry[] | null>(null);
  const [currentDatasheet, setCurrentDatasheet] = useState<AnalyticsDataEntry | null>(null);
  const [datasheet, setDatasheet] = useState<Pricing | null>(null);
  const [datasheetYamlText, setDatasheetYamlText] = useState<string | null>(null);
  const [oldestDatasheetDate, setOldestDatasheetDate] = useState<string | null>(null);

  const pathname = usePathname();
  const { getPricingByName, updateClientPricingVersion } = usePricingsApi();
  const pathSegments = pathname.split('/');
  const datasheetName = pathSegments[pathSegments.length - 1] as string;
  const datasheetOwner = pathSegments[pathSegments.length - 2] as string;
  const isVimeoMock = datasheetOwner === 'mock' && datasheetName === 'vimeo';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateDatasheetInformation(pricing: any) {
    if (pricing.versions && pricing.versions.length > 0) {
      const latestVersion = pricing.versions[0];
      const oldestVersion = pricing.versions[pricing.versions.length - 1];
      setFullDatasheetData(pricing.versions);
      setDatasheetData(pricing.versions);
      setCurrentDatasheet(latestVersion);
      setOldestDatasheetDate(oldestVersion.extractionDate);
    } else {
      throw new Error('No datasheet versions found');
    }
  }

  useEffect(() => {
    if (isVimeoMock) {
      setFullDatasheetData([VIMEO_MOCK_VERSION_ENTRY]);
      setDatasheetData([VIMEO_MOCK_VERSION_ENTRY]);
      setCurrentDatasheet(VIMEO_MOCK_VERSION_ENTRY);
      setOldestDatasheetDate(VIMEO_MOCK_VERSION_ENTRY.extractionDate);
      return;
    }

    const name = pathname.split('/').pop() as string;
    const owner = pathname.split('/')[pathname.split('/').length - 2] as string;

    getPricingByName(name, owner, null).then(pricing => {
      try {
        updateDatasheetInformation(pricing);
      } catch (err: any) {
        customAlert(err.message || err.msg);
      }
    });
  }, [pathname, getPricingByName, isVimeoMock]);

  useEffect(() => {
    if (currentDatasheet === null) {
      return;
    }

    if (isVimeoMock) {
      fetch(VIMEO_MOCK_VERSION_ENTRY.yaml).then(async response => {
        const rawYaml = await response.text();
        setDatasheetYamlText(rawYaml);
      });
      return;
    }

    fetch(currentDatasheet.yaml).then(async response => {
      const rawYaml = await response.text();

      let parsed: Pricing | null = null;

      try {
        parsed = retrievePricingFromYaml(rawYaml);
      } catch {
        if (!/syntaxVersion\s*:\s*["']?3\.0["']?/.test(rawYaml)) {
          parsed = await updateClientPricingVersion(rawYaml);
        }
      }

      setDatasheet(parsed);
      setDatasheetYamlText(rawYaml);
    });
  }, [datasheetData, currentDatasheet, updateClientPricingVersion, isVimeoMock]);

  const handleApplyVariables = (variables: Record<string, string | number | boolean>) => {
    if (datasheetYamlText) {
      const newYaml = (function replaceVariablesInYaml(yaml: string, vars: Record<string, unknown>) {
        const serializeVal = (v: unknown) => {
          if (typeof v === 'string') return JSON.stringify(v);
          if (typeof v === 'boolean') return v ? 'true' : 'false';
          if (typeof v === 'number' && Number.isFinite(v)) return String(v);
          return JSON.stringify(v);
        };

        const varsLines = ['variables:'];
        for (const key of Object.keys(vars)) {
          varsLines.push(`  ${key}: ${serializeVal(vars[key])}`);
        }
        const varsBlock = varsLines.join('\n');

        const variablesRegex = /^variables:\n(?:[ \t]+.+\n?)*/gm;

        if (variablesRegex.test(yaml)) {
          return yaml.replace(variablesRegex, varsBlock + '\n');
        }

        const insertAfterRegex = /^(createdAt:.*|currency:.*)$/mi;
        const match = insertAfterRegex.exec(yaml);
        if (match) {
          const idx = (match.index ?? 0) + (match[0]?.length ?? 0);
          return yaml.slice(0, idx) + '\n' + varsBlock + yaml.slice(idx);
        }
        return yaml + '\n' + varsBlock + '\n';
      })(datasheetYamlText, variables);

      try {
        const parsed = retrievePricingFromYaml(newYaml);
        setDatasheet(parsed);
        setDatasheetYamlText(newYaml);
        return;
      } catch {
        setDatasheet(prev => (prev ? { ...prev, variables } : prev));
        return;
      }
    }

    setDatasheet(prev => (prev ? { ...prev, variables } : prev));
  };

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

  return (
    <>
      <Helmet>
        <title>{`SPHERE - ${isVimeoMock ? VIMEO_MOCK_DATASHEET.saasName : datasheet?.saasName} Datasheet`}</title>
      </Helmet>

      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" flexDirection="column">
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h5" letterSpacing={1}>
                  {isVimeoMock ? VIMEO_MOCK_DATASHEET.saasName : datasheet?.saasName}
                </Typography>
              </Box>

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
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
                {datasheetData?.map((entry, index) => (
                  <option key={index} value={entry.yaml}>
                    {entry.yaml
                      .split('/')
                      [entry.yaml.split('/').length - 1].replace('.yaml', '')
                      .replace('.yml', '')}
                  </option>
                ))}
              </TextField>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          {tabValue === 1 && datasheetData && <FileExplorer pricingData={datasheetData} />}

          {tabValue === 0 && (
            <Box flex={1}>
              <Typography variant="h6" gutterBottom>
                Datasheet information
              </Typography>
              <Typography variant="body1" sx={{ mb: 4 }}>
                This is the datasheet information for{' '}
                {isVimeoMock ? VIMEO_MOCK_DATASHEET.saasName : datasheet?.saasName}. The version
                currently displayed is from{' '}
                {currentDatasheet?.extractionDate
                  ? new Date(currentDatasheet.extractionDate).toLocaleDateString()
                  : 'Unknown date'}
                . The representation is generated dynamically from the source syntax.
              </Typography>

              {isVimeoMock ? (
                <MockDatasheetRenderer datasheet={VIMEO_MOCK_DATASHEET} />
              ) : (
                datasheet && (
                <PricingRenderer
                  pricing={datasheet}
                  errors={[]}
                  onApplyVariables={handleApplyVariables}
                />
                )
              )}
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
}