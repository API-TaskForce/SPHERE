import { useState } from 'react';
import { Box, Button, Container, Paper, Typography, Alert, CircularProgress } from '@mui/material';
import { Helmet } from 'react-helmet';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import customAlert from '../../../core/utils/custom-alert';

type ParsedDatasheetMeta = {
  saasName: string;
  version: string;
};

const sanitizeVersionSegment = (value: string) =>
  value.trim().replace(/[<>:"/\\|?*\u0000-\u001F\s]+/g, '_');

async function extractDatasheetMeta(file: File): Promise<ParsedDatasheetMeta> {
  const rawYaml = await file.text();
  const YAMLModule = await import('yaml');

  const parseYaml =
    (YAMLModule.parse as ((text: string) => Record<string, unknown>) | undefined) ||
    (YAMLModule.default?.parse as ((text: string) => Record<string, unknown>) | undefined);

  if (!parseYaml) {
    return { saasName: 'unknown-saas', version: `upload-${Date.now()}` };
  }

  const parsed = parseYaml(rawYaml);
  const saasName =
    ((parsed.associated_saas as string | undefined) ||
      (parsed.saasName as string | undefined) ||
      'unknown-saas')
      .toString()
      .trim();
  const rawVersion =
    ((parsed.date as string | undefined) ||
      (parsed.version as string | undefined) ||
      (parsed.syntax_version as string | undefined) ||
      `upload-${Date.now()}`)
      .toString()
      .trim();
  const version = sanitizeVersionSegment(rawVersion) || `upload-${Date.now()}`;

  return {
    saasName: saasName || 'unknown-saas',
    version: version || '0.0.0',
  };
}

export default function CreateDatasheetPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewName, setPreviewName] = useState('');
  const { authUser } = useAuth();
  const navigate = useNavigate();

  if (!authUser?.isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Alert severity="warning">
            You need to be logged in to upload a datasheet. Please <a href="/login">login</a> first.
          </Alert>
        </Box>
      </Container>
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
    
    if (!file) {
      customAlert('Please select a file');
      return;
    }

    if (!authUser?.token) {
      customAlert('You are not authenticated');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const { saasName, version } = await extractDatasheetMeta(file);

      formData.append('saasName', saasName);
      formData.append('version', version);
      formData.append('yaml', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/datasheets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authUser.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      customAlert('Datasheet uploaded successfully!');
      
      if (result.owner && result.name) {
        navigate(`/datasheets/${result.owner}/${result.name}`);
      } else {
        navigate('/datasheets');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed';
      customAlert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>SPHERE - Upload Datasheet</title>
      </Helmet>

      <Container maxWidth="sm">
        <Box sx={{ my: 6 }}>
          <Paper
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" fontWeight="bold">
              Upload Datasheet
            </Typography>

            <Box
              sx={{
                width: '100%',
                p: 3,
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.dark',
                },
              }}
              component="label"
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              <Box>
                <Typography variant="body1" fontWeight="500">
                  Click to select or drag and drop
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  YAML files (.yaml, .yml)
                </Typography>
              </Box>
              <input
                type="file"
                accept=".yaml,.yml"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Box>

            {file && (
              <Box sx={{ width: '100%', textAlign: 'left' }}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  ✓ File selected
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Size: {(file.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            )}

            {previewName && (
              <Box sx={{ width: '100%', textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Datasheet Name:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    p: 1.5,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    wordBreak: 'break-word',
                  }}
                >
                  {previewName}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setFile(null);
                  setPreviewName('');
                }}
                disabled={!file || loading}
              >
                Clear
              </Button>

              <Button
                variant="contained"
                fullWidth
                onClick={handleUpload}
                disabled={!file || loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Uploading...' : 'Upload'}
              </Button>
            </Box>

            <Alert severity="info" sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2">
                <strong>Format:</strong> Upload a YAML file with your API datasheet definition.
              </Typography>
              <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                Supports SPHERE format v0.3 with plans, endpoints, aliases, and workload definitions.
              </Typography>
            </Alert>
          </Paper>
        </Box>
      </Container>
    </>
  );
}
