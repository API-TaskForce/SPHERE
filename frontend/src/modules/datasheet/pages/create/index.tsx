import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { MdCloudUpload } from 'react-icons/md';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import customAlert from '../../../core/utils/custom-alert';

type ParsedDatasheetMeta = { saasName: string; version: string };

const sanitizeVersionSegment = (value: string) =>
  value.trim().replace(/[<>:"/\\|?*\u0000-\u001F\s]+/g, '_');

async function extractDatasheetMeta(file: File): Promise<ParsedDatasheetMeta> {
  const rawYaml = await file.text();
  const YAMLModule = await import('yaml');
  const parseYaml =
    (YAMLModule.parse as ((text: string) => Record<string, unknown>) | undefined) ||
    (YAMLModule.default?.parse as ((text: string) => Record<string, unknown>) | undefined);

  if (!parseYaml) return { saasName: 'unknown-saas', version: `upload-${Date.now()}` };

  const parsed = parseYaml(rawYaml);
  const saasName =
    ((parsed.associated_saas as string | undefined) || (parsed.saasName as string | undefined) || 'unknown-saas')
      .toString().trim();
  const rawVersion =
    ((parsed.date as string | undefined) || (parsed.version as string | undefined) ||
      (parsed.syntax_version as string | undefined) || `upload-${Date.now()}`).toString().trim();
  const version = sanitizeVersionSegment(rawVersion) || `upload-${Date.now()}`;

  return { saasName: saasName || 'unknown-saas', version: version || '0.0.0' };
}

export default function CreateDatasheetPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewName, setPreviewName] = useState('');
  const { authUser } = useAuth();
  const navigate = useNavigate();

  if (!authUser?.isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto px-4">
        <div className="my-8 text-center">
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded px-4 py-3 text-sm">
            You need to be logged in to upload a datasheet. Please{' '}
            <a href="/login" className="underline font-medium">login</a> first.
          </div>
        </div>
      </div>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.yaml') && !selectedFile.name.endsWith('.yml')) {
        customAlert('Please select a YAML file (.yaml or .yml)');
        return;
      }
      setFile(selectedFile);
      setPreviewName(selectedFile.name.replace(/\.(yaml|yml)$/, ''));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { customAlert('Please select a file'); return; }
    if (!authUser?.token) { customAlert('You are not authenticated'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      const { saasName, version } = await extractDatasheetMeta(file);
      formData.append('saasName', saasName);
      formData.append('version', version);
      formData.append('yaml', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/datasheets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authUser.token}` },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      customAlert('Datasheet uploaded successfully!');
      if (result.owner && result.name) navigate(`/datasheets/${result.owner}/${result.name}`);
      else navigate('/datasheets');
    } catch (error) {
      customAlert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>SPHERE - Upload Datasheet</title>
      </Helmet>

      <div className="max-w-sm mx-auto px-4">
        <div className="my-12">
          <div className="bg-white rounded-lg shadow p-8 flex flex-col gap-6 items-center text-center">
            <h1 className="text-3xl font-bold">Upload Datasheet</h1>

            <label
              className="w-full p-6 border-2 border-dashed border-sphere-primary-500 rounded-lg flex flex-col items-center gap-4 cursor-pointer transition-colors hover:bg-sphere-grey-100 hover:border-sphere-primary-700"
            >
              <MdCloudUpload size={48} className="text-sphere-primary-500" />
              <div>
                <p className="text-base font-medium">Click to select or drag and drop</p>
                <p className="text-sm text-[#637381]">YAML files (.yaml, .yml)</p>
              </div>
              <input type="file" accept=".yaml,.yml" onChange={handleFileSelect} className="hidden" />
            </label>

            {file && (
              <div className="w-full text-left">
                <p className="text-sm font-semibold text-green-600 mb-1">✓ File selected</p>
                <p className="text-sm break-all">{file.name}</p>
                <p className="text-xs text-[#637381]">Size: {(file.size / 1024).toFixed(2)} KB</p>
              </div>
            )}

            {previewName && (
              <div className="w-full text-left">
                <p className="text-sm font-semibold mb-1">Datasheet Name:</p>
                <p className="text-sm bg-[#F9FAFB] rounded px-3 py-2 break-words">{previewName}</p>
              </div>
            )}

            <div className="flex gap-4 w-full">
              <button
                className="flex-1 px-4 py-2 border border-[#DFE3E8] rounded hover:bg-sphere-grey-100 transition-colors disabled:opacity-50"
                onClick={() => { setFile(null); setPreviewName(''); }}
                disabled={!file || loading}
              >
                Clear
              </button>
              <button
                className="flex-1 px-4 py-2 bg-sphere-primary-600 text-white rounded hover:bg-sphere-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                onClick={handleUpload}
                disabled={!file || loading}
              >
                {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>

            <div className="w-full bg-blue-50 border border-blue-200 text-blue-800 rounded px-4 py-3 text-left mt-2">
              <p className="text-sm"><strong>Format:</strong> Upload a YAML file with your API datasheet definition.</p>
              <p className="text-xs mt-1">Supports SPHERE format v0.3 with plans, endpoints, aliases, and workload definitions.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
