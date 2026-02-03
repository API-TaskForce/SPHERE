import { useState } from 'react';
import { Box, Typography, Switch, FormControlLabel, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PricingNameInput from '../pricing-name-input';
import VisibilityOptions from '../visibility-options';
import FileUpload from '../../../core/components/file-upload-input';
import PricingLogo from '../pricing-logo';
import { usePricingsApi } from '../../api/pricingsApi';
import customAlert from '../../../core/utils/custom-alert';
import { useRouter } from '../../../core/hooks/useRouter';

export default function CreatePricingForm () {
  const [modelName, setModelName] = useState('');
  const [visibility, setVisibility] = useState('Public');
  const [isApi, setIsApi] = useState(false);

  const { createPricing } = usePricingsApi();
  const router = useRouter();

  const handleSubmit = async (file: File) => {
    if (!file) {
      customAlert('Please select a file');
      return;
    }

    // read file to extract version and maybe saasName
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });

    // simple regex extraction
    let versionMatch = text.match(/^[ \t]*version:\s*["']?([^\s"']+)/im);
    let saasNameMatch = text.match(/^[ \t]*saasName:\s*["']?([^\n"']+)/im);

    const version = versionMatch ? versionMatch[1] : '0.0.0';
    const saasName = modelName || (saasNameMatch ? saasNameMatch[1] : 'unnamed-pricing');

    const formData = new FormData();
    formData.append('yaml', file, file.name);
    formData.append('saasName', saasName);
    formData.append('version', version);
    formData.append('isApi', isApi ? 'true' : 'false');

    const resp = await createPricing(formData, (errors: string[]) => {
      if (errors && errors.length > 0) {
        errors.forEach(e => customAlert(e));
      }
    });

    if (resp) {
      customAlert('Pricing uploaded');
      router.push('/pricings');
    }
  };

  return (
    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <PricingLogo size={100} />
      </Box>
      <Typography variant="h5" align="center" marginBottom={10} fontWeight="bold">Upload a pricing to SPHERE</Typography>
      <PricingNameInput value={modelName} onChange={setModelName} />
      {/* <LicenseInput value={license} onChange={setLicense} /> */}
      {/* <TemplateSelector /> */}
      <VisibilityOptions value={visibility} onChange={setVisibility} />

      <FormControlLabel
        control={<Switch checked={isApi} onChange={(e) => setIsApi(e.target.checked)} />}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>¿Es una API?</span>
            <Tooltip title="Si activas este flag, el pricing se tratará como una API. Es algo temporal. En el futuro este campo se podria detectar automáticamente por el contenido del YAML.">
              <InfoOutlinedIcon fontSize="small" />
            </Tooltip>
          </Box>
        }
      />

      <FileUpload onSubmit={handleSubmit} submitButtonText="Add Pricing" submitButtonWidth={200}/>
      <Box sx={{ height: 50 }} />
    </Box>
  );
};
