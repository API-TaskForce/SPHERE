import { useState, useEffect, useRef } from 'react';
import Grid from '@mui/material/Grid2';
import Editor, { Monaco } from '@monaco-editor/react';
import { Box, Typography, Modal, Paper, Tab, Tabs } from '@mui/material';
import { Helmet } from 'react-helmet';
import monaco from 'monaco-editor';
import { parse as yamlParse } from 'yaml';
import { v4 as uuidv4 } from 'uuid';

import { useMode } from '../../../core/hooks/useTheme';
import { default as GithubDarkTheme } from '../../../core/theme/editor-themes/GitHub-Dark.json';
import { default as TextmateTheme } from '../../../core/theme/editor-themes/Textmate.json';
import { flex } from '../../../core/theme/css';
import { grey } from '../../../core/theme/palette';
import customAlert from '../../../core/utils/custom-alert';

import { useCacheApi } from '../../../pricing-editor/components/pricing-renderer/api/cacheApi';
import { parseStringYamlToEncodedYaml, parseEncodedYamlToStringYaml } from '../../../pricing-editor/services/export.service';
import CopyToClipboardIcon from '../../../core/components/copy-icon';
import FileUpload from '../../../core/components/file-upload-input';

import DatasheetRenderer from '../../components/datasheet-renderer';
import { DatasheetModel } from '../../types/datasheetTypes';
import DatasheetHeader from './header';

const DEFAULT_DATASHEET_YAML = `associated_saas: mailersend
type: partial_saas
url: https://www.mailersend.com/pricing
syntax_version: 0.3
date: 2026-03-19
currency: USD
consumption_units:
  - emails
  - requests
  - sms

capacity:
  quota_500_emails_month:
    value: 500
    unit: emails
    period:
      value: 1
      unit: MONTH
    window_type: rolling
  quota_5k_emails_month:
    value: 5000
    unit: emails
    period:
      value: 1
      unit: MONTH
    overage_cost:
      price: 1.20
      value: 1000
    window_type: rolling
  quota_50k_emails_month:
    value: 50000
    unit: emails
    period:
      value: 1
      unit: MONTH
    overage_cost:
      price: 0.95
      value: 1000
    window_type: rolling
  quota_100_req_day:
    value: 100
    unit: requests
    period:
      value: 1
      unit: DAY
    window_type: fixed_utc_midnight
  quota_1k_req_day:
    value: 1000
    unit: requests
    period:
      value: 1
      unit: DAY
    window_type: fixed_utc_midnight
  quota_100k_req_day:
    value: 100000
    unit: requests
    period:
      value: 1
      unit: DAY
    window_type: fixed_utc_midnight
  quota_500k_req_day:
    value: 500000
    unit: requests
    period:
      value: 1
      unit: DAY
    window_type: fixed_utc_midnight
  quota_100_sms_month:
    value: 100
    unit: sms
    period:
      value: 1
      unit: MONTH
    overage_cost:
      price: 1.40
      value: 100
    window_type: rolling
  quota_150_sms_month:
    value: 150
    unit: sms
    period:
      value: 1
      unit: MONTH
    overage_cost:
      price: 1.40
      value: 100
    window_type: rolling

max_power:
  rate_120_min:
    value: 120
    unit: requests
    period:
      value: 1
      unit: MIN
  rate_60_min:
    value: 60
    unit: requests
    period:
      value: 1
      unit: MIN
  rate_30_min:
    value: 30
    unit: requests
    period:
      value: 1
      unit: MIN
  rate_15_min:
    value: 15
    unit: requests
    period:
      value: 1
      unit: MIN
  rate_10_min:
    value: 10
    unit: requests
    period:
      value: 1
      unit: MIN
  rate_1_min:
    value: 1
    unit: requests
    period:
      value: 1
      unit: MIN

plans:
  free:
    price: 0.0
    period:
      value: 1
      unit: MONTH
    quota: quota_100_req_day
    endpoints:
      /*:
        rate: rate_60_min
      v1/email:
        quota: quota_500_emails_month
        workload:
          unit: emails
          min: 1
          max: 70
          description: "depends on the params you use, cc, to, bcc"
        healthy_reputation:
          rate: rate_120_min
        under_review_reputation:
          rate: rate_10_min
      v1/bulk:
        quota: quota_500_emails_month
        workload:
          unit: emails
          min: 1
          max: 35000
          description: "depends on the number of emails you send and the params you use, cc, to, bcc"
        healthy_reputation:
          rate: rate_10_min
        under_review_reputation:
          rate: rate_1_min

  hobby:
    price: 5.60
    period:
      value: 1
      unit: MONTH
    quota: quota_1k_req_day
    endpoints:
      /*:
        rate: rate_60_min
      v1/email:
        quota: quota_5k_emails_month
        workload:
          unit: emails
          min: 1
          max: 70
          description: "depends on the params you use, cc, to, bcc"
        healthy_reputation:
          rate: rate_120_min
        under_review_reputation:
          rate: rate_10_min
      v1/bulk:
        quota: quota_5k_emails_month
        workload:
          unit: emails
          min: 1
          max: 35000
          description: "depends on the number of emails you send and the params you use, cc, to, bcc"
        healthy_reputation:
          rate: rate_10_min
        under_review_reputation:
          rate: rate_1_min

  starter:
    price: 28.00 
    period:
      value: 1
      unit: MONTH
    quota: quota_100k_req_day
    endpoints:
      /*:
        rate: rate_60_min
      v1/email:
        quota: quota_50k_emails_month
        workload:
          unit: emails
          min: 1
          max: 70
          description: "depends on the params you use, cc, to, bcc"
        healthy_reputation:
          rate: rate_120_min
        under_review_reputation:
          rate: rate_10_min
      v1/bulk:
        quota: quota_50k_emails_month
        workload:
          unit: emails
          min: 1
          max: 35000
          description: "depends on the number of emails you send and the params you use, cc, to, bcc"
        healthy_reputation:
          rate: rate_10_min
        under_review_reputation:
          rate: rate_1_min
      v1/sms:
        rate: rate_60_min
        quota: quota_100_sms_month
        workload:
          unit: sms
          min: 1
          max: 50
          description: "depends on the number of people you send sms to"

  professional:
    price: 88.00
    period:
      value: 1
      unit: MONTH
    quota: quota_500k_req_day
    endpoints:
      /*:
        rate: rate_60_min
      v1/email:
        quota: quota_50k_emails_month
        workload:
          unit: emails
          min: 1
          max: 70
          description: "depends on the params you use, cc, to, bcc"
        healthy_reputation:
          rate: rate_120_min
        under_review_reputation:
          rate: rate_10_min
      v1/bulk:
        quota: quota_50k_emails_month
        workload:
          unit: emails
          min: 1
          max: 35000
          description: "depends on the number of emails you send and the params you use, cc, to, bcc"
        healthy_reputation:
          rate: rate_10_min
        under_review_reputation:
          rate: rate_1_min
      v1/sms:
        rate: rate_60_min
        quota: quota_150_sms_month
        workload:
          unit: sms
          min: 1
          max: 50
          description: "depends on the number of people you send sms to"

`;

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
    plans: (parsedYaml.plans as Record<string, any>) || {},
  } as DatasheetModel;
}

export default function DatasheetEditorPage() {
  const { mode } = useMode();
  const [editorValue, setEditorValue] = useState<string>(DEFAULT_DATASHEET_YAML);
  const [datasheet, setDatasheet] = useState<DatasheetModel | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [sharedLinkModalOpen, setSharedLinkModalOpen] = useState(false);
  const [importModalOpen, setImportLinkModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const { setInCache, getFromCache } = useCacheApi();

  const renderSharedLink = () => setSharedLinkModalOpen(true);
  const handleSharedLinkClose = () => setSharedLinkModalOpen(false);
  const renderYamlImport = () => setImportLinkModalOpen(true);
  const handleYamlImportClose = () => setImportLinkModalOpen(false);

  const handleCopyToClipboard = () => {
    if (sharedLinkModalOpen) {
      if (tabValue === 1) { // Full export
        const encodedDatasheet = parseStringYamlToEncodedYaml(editorValue);
        const baseUrl = window.location.href.split('?')[0];
        return `${baseUrl}?datasheet=${encodedDatasheet}`;
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const assignedId = urlParams.get('datasheet') ?? uuidv4();
        const encodedDatasheet = parseStringYamlToEncodedYaml(editorValue);

        setInCache(assignedId, encodedDatasheet, 24 * 60 * 60) // 24h
          .catch(error => {
            customAlert(`Error saving link in cache: ${error}`);
          });

        const baseUrl = window.location.href.split('?')[0];
        return `${baseUrl}?datasheet=${assignedId}`;
      }
    } else {
      return '';
    }
  };

  const onSubmitImport = (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditorValue(result);
        handleEditorChange(result);
      };
      reader.readAsText(file);
    } else {
      customAlert('No file selected');
    }
    handleYamlImportClose();
  };

  function handleEditorChange(value: string | undefined) {
    if (value !== undefined) {
      setEditorValue(value);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        try {
          const parsedYaml = yamlParse(value) as Record<string, unknown>;
          if (typeof parsedYaml !== 'object' || parsedYaml === null) {
            throw new Error('Invalid YAML format');
          }
          const normalizedDatasheet = normalizeDatasheetShape(parsedYaml);
          setDatasheet(normalizedDatasheet);
          setErrors([]);
        } catch (err) {
          const errorMessage = (err as Error).message || 'Error parsing YAML';
          setErrors([errorMessage]);
        }
      }, 500);
    }
  }

  function handleEditorDidMount(editorInstance: Monaco) {
    editorInstance.editor.defineTheme(
      'github-dark',
      GithubDarkTheme as monaco.editor.IStandaloneThemeData
    );
    editorInstance.editor.defineTheme(
      'textmate',
      TextmateTheme as monaco.editor.IStandaloneThemeData
    );
  }

  useEffect(() => {
    const fetchDatasheet = async () => {
      const queryParams = new URLSearchParams(globalThis.location.search);
      const datasheetParam = queryParams.get('datasheet');
      
      let templateDatasheet = DEFAULT_DATASHEET_YAML;

      if (datasheetParam) {
        if (datasheetParam.length > 36){ // It is greater that UUID          
          templateDatasheet = parseEncodedYamlToStringYaml(datasheetParam);
        } else {
          try {
            const cachedDatasheet = await getFromCache(datasheetParam);
            if (cachedDatasheet) {
              templateDatasheet = parseEncodedYamlToStringYaml(cachedDatasheet);
            }
          } catch(e) {
             console.error("Failed to load datasheet from cache", e);
          }
        }
      }

      setEditorValue(templateDatasheet);
      handleEditorChange(templateDatasheet);
    };

    fetchDatasheet();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Helmet>
        <title>SPHERE - Datasheet Editor</title>
      </Helmet>
      <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <DatasheetHeader
          editorValue={editorValue}
          setEditorValue={(val) => {
            setEditorValue(val);
            handleEditorChange(val);
          }}
          renderSharedLink={renderSharedLink}
          renderYamlImport={renderYamlImport}
        />
        <Grid
          container
          sx={{
            flexGrow: 1,
            backgroundColor: grey[400],
            overflow: 'hidden'
          }}
        >
          <Grid size={6} sx={{ height: '100%', overflow: 'hidden' }}>
            <Editor
              height="100%"
              defaultLanguage="yaml"
              onChange={handleEditorChange}
              value={editorValue}
              theme={mode === 'light' ? 'textmate' : 'github-dark'}
              beforeMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 16,
              }}
            />
          </Grid>
          <Grid
            size={6}
            sx={{
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              backgroundColor: mode === 'light' ? grey[100] : grey[800],
              boxSizing: 'border-box',
              p: 4,
            }}
          >
            {errors.length > 0 && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                <Typography variant="subtitle2">Parse Errors:</Typography>
                {errors.map((err, i) => (
                  <Typography key={i} variant="body2">{err}</Typography>
                ))}
              </Box>
            )}
            {datasheet ? (
              <Box sx={{ width: '100%', bgcolor: 'background.paper', p: 3, borderRadius: 2 }}>
                <DatasheetRenderer datasheet={datasheet} />
              </Box>
            ) : (
              <Typography color="text.secondary">Awaiting valid YAML...</Typography>
            )}
          </Grid>
        </Grid>
      </Box>
      <Modal
        open={sharedLinkModalOpen}
        onClose={handleSharedLinkClose}
        aria-labelledby="modal-shared-link-title"
        aria-describedby="modal-shared-link-description"
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 600,
            width: '90vw',
            mx: 'auto',
            mt: 4,
            p: 4,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
            borderRadius: '20px',
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            Your datasheet is a step away from the world
          </Typography>
          <Typography sx={{ mt: 2, mb: 3, textAlign: 'center' }}>
            Share this link to allow other users to see and edit their own version of your datasheet
          </Typography>

          <Box sx={{ ...flex({justify: "center"}), mb: 2 }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label="Short encoding" />
              <Tab label="Full encoding" />
            </Tabs>
          </Box>

          {
            tabValue === 1 ? (
              <Typography
                variant="body2"
                color="error"
                sx={{ textAlign: 'center', mb: 2 }}
              >
                <strong>WARNING:</strong> If the YAML is too large, the URL might not be processed correctly.
              </Typography>
            )
            :
            (
              <Typography
                variant="body2"
                color="info"
                sx={{ textAlign: 'center', mb: 2 }}
              >
                <strong>INFO:</strong> The generated URL will only be available for 24h.
              </Typography>
            )
          }

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CopyToClipboardIcon value={handleCopyToClipboard()} />
          </Box>
        </Paper>
      </Modal>
      <Modal
        open={importModalOpen}
        onClose={handleYamlImportClose}
        aria-labelledby="modal-import-title"
        aria-describedby="modal-import-description"
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 500,
            width: '90dvw',
            mx: 'auto',
            mt: 4,
            p: 4,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
            borderRadius: '20px',
            ...flex({ direction: 'column' }),
          }}
        >
          <FileUpload onSubmit={onSubmitImport} />
        </Paper>
      </Modal>
    </>
  );
}