import { Helmet } from 'react-helmet';
import { Container, Box, Typography } from '@mui/material';
import { PricingRenderer } from '../../../pricing-editor/components/pricing-renderer';
import { useEffect, useState } from 'react';
import { getAzureAiSearchPricing, azureAiSearchYaml } from '../../mock/azureAiSearchPricing';
import { Pricing } from 'pricing4ts';

export default function SamplePricingPage() {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [yaml, setYaml] = useState<string | null>(null);

  useEffect(() => {
    const p = getAzureAiSearchPricing();
    setPricing(p);
    setYaml(azureAiSearchYaml);
  }, []);

  return (
    <>
      <Helmet>
        <title> SPHERE - Azure AI Search (sample) </title>
      </Helmet>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Azure AI Search (sample)
          </Typography>

          <Typography variant="body1" color="text.secondary" mb={4}>
            This is a local sample pricing file included for demonstrations and testing.
          </Typography>

          {pricing ? (
            <PricingRenderer pricing={pricing} errors={[]} />
          ) : (
            <Typography color="text.secondary">Unable to parse sample pricing.</Typography>
          )}
        </Box>
      </Container>
    </>
  );
}
