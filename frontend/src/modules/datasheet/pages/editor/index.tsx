import { useState, useEffect, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Helmet } from 'react-helmet';
import monaco from 'monaco-editor';
import { parse as yamlParse } from 'yaml';
import { v4 as uuidv4 } from 'uuid';

import { useMode } from '../../../core/hooks/useTheme';
import { default as GithubDarkTheme } from '../../../core/theme/editor-themes/GitHub-Dark.json';
import { default as TextmateTheme } from '../../../core/theme/editor-themes/Textmate.json';
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
    saasName: (parsedYaml.saasName as string | undefined) || (parsedYaml.associated_saas as string | undefined) || 'Unknown SaaS',
    type: (parsedYaml.type as string | undefined) || 'partial_saas',
    sourceUrl: (parsedYaml.sourceUrl as string | undefined) || (parsedYaml.source_url as string | undefined) || (parsedYaml.url as string | undefined) || '',
    syntaxVersion: (parsedYaml.syntaxVersion as string | undefined) || (parsedYaml.syntax_version as string | undefined) || '',
    date: (parsedYaml.date as string | undefined) || '',
    currency: parsedYaml.currency as string | undefined,
    consumptionUnits: (parsedYaml.consumptionUnits as string[] | undefined) || (parsedYaml.consumption_units as string[] | undefined),
    capacity: (parsedYaml.capacity as Record<string, unknown>) || {},
    maxPower: (parsedYaml.maxPower as Record<string, unknown>) || (parsedYaml.max_power as Record<string, unknown>) || {},
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

  const handleSharedLinkClose = () => setSharedLinkModalOpen(false);
  const handleYamlImportClose = () => setImportLinkModalOpen(false);

  const handleCopyToClipboard = () => {
    if (!sharedLinkModalOpen) return '';
    if (tabValue === 1) {
      return `${window.location.href.split('?')[0]}?datasheet=${parseStringYamlToEncodedYaml(editorValue)}`;
    }
    const assignedId = new URLSearchParams(window.location.search).get('datasheet') ?? uuidv4();
    setInCache(assignedId, parseStringYamlToEncodedYaml(editorValue), 24 * 60 * 60)
      .catch(error => customAlert(`Error saving link in cache: ${error}`));
    return `${window.location.href.split('?')[0]}?datasheet=${assignedId}`;
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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        try {
          const parsedYaml = yamlParse(value) as Record<string, unknown>;
          if (typeof parsedYaml !== 'object' || parsedYaml === null) throw new Error('Invalid YAML format');
          setDatasheet(normalizeDatasheetShape(parsedYaml));
          setErrors([]);
        } catch (err) {
          setErrors([(err as Error).message || 'Error parsing YAML']);
        }
      }, 500);
    }
  }

  function handleEditorDidMount(editorInstance: Monaco) {
    editorInstance.editor.defineTheme('github-dark', GithubDarkTheme as monaco.editor.IStandaloneThemeData);
    editorInstance.editor.defineTheme('textmate', TextmateTheme as monaco.editor.IStandaloneThemeData);
  }

  useEffect(() => {
    const fetchDatasheet = async () => {
      const queryParams = new URLSearchParams(globalThis.location.search);
      const datasheetParam = queryParams.get('datasheet');
      let templateDatasheet = DEFAULT_DATASHEET_YAML;

      if (datasheetParam) {
        if (datasheetParam.length > 36) {
          templateDatasheet = parseEncodedYamlToStringYaml(datasheetParam);
        } else {
          try {
            const cachedDatasheet = await getFromCache(datasheetParam);
            if (cachedDatasheet) templateDatasheet = parseEncodedYamlToStringYaml(cachedDatasheet);
          } catch (e) {
            console.error('Failed to load datasheet from cache', e);
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
      <div className="w-full h-screen flex flex-col">
        <DatasheetHeader
          editorValue={editorValue}
          setEditorValue={(val) => { setEditorValue(val); handleEditorChange(val); }}
          renderSharedLink={() => setSharedLinkModalOpen(true)}
          renderYamlImport={() => setImportLinkModalOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden" style={{ backgroundColor: '#C4CDD5' }}>
          <div className="w-1/2 h-full overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="yaml"
              onChange={handleEditorChange}
              value={editorValue}
              theme={mode === 'light' ? 'textmate' : 'github-dark'}
              beforeMount={handleEditorDidMount}
              options={{ minimap: { enabled: false }, fontSize: 16 }}
            />
          </div>
          <div
            className="w-1/2 h-full overflow-y-auto overflow-x-hidden p-8 box-border"
            style={{ backgroundColor: mode === 'light' ? '#F9FAFB' : '#212B36' }}
          >
            {errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
                <p className="text-sm font-semibold">Parse Errors:</p>
                {errors.map((err, i) => <p key={i} className="text-sm">{err}</p>)}
              </div>
            )}
            {datasheet ? (
              <div className="w-full bg-white p-6 rounded-xl">
                <DatasheetRenderer datasheet={datasheet} />
              </div>
            ) : (
              <p className="text-[#637381]">Awaiting valid YAML...</p>
            )}
          </div>
        </div>
      </div>

      {/* Shared Link Modal */}
      {sharedLinkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleSharedLinkClose}
        >
          <div
            className="bg-white rounded-[20px] p-8 max-w-[600px] w-[90vw] shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-center mb-4">
              Your datasheet is a step away from the world
            </h2>
            <p className="text-center mt-4 mb-6">
              Share this link to allow other users to see and edit their own version of your datasheet
            </p>

            <div className="flex justify-center mb-4">
              <div className="flex border-b border-[#DFE3E8]">
                {['Short encoding', 'Full encoding'].map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setTabValue(i)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      tabValue === i
                        ? 'border-sphere-primary-600 text-sphere-primary-600'
                        : 'border-transparent text-[#637381] hover:text-[#212B36]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tabValue === 1 ? (
              <p className="text-sm text-red-500 text-center mb-4">
                <strong>WARNING:</strong> If the YAML is too large, the URL might not be processed correctly.
              </p>
            ) : (
              <p className="text-sm text-blue-600 text-center mb-4">
                <strong>INFO:</strong> The generated URL will only be available for 24h.
              </p>
            )}

            <div className="flex items-center">
              <CopyToClipboardIcon value={handleCopyToClipboard()} />
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleYamlImportClose}
        >
          <div
            className="bg-white rounded-[20px] p-8 max-w-[500px] w-[90dvw] shadow-xl flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <FileUpload onSubmit={onSubmitImport} />
          </div>
        </div>
      )}
    </>
  );
}
