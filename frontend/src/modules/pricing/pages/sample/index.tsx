import { Helmet } from 'react-helmet';
import { Container, Box, Typography } from '@mui/material';
import { PricingRenderer } from '../../../pricing-editor/components/pricing-renderer';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pricing } from 'pricing4ts';
import { SAMPLES } from '../../mock/registry';

import ApiDatasheet from '../../components/api-datasheet';

export default function SamplePricingPage() {
  const { name } = useParams();
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [currentTitle, setCurrentTitle] = useState('Sample Pricing');
  const [datasheet, setDatasheet] = useState<any | null>(null);

  useEffect(() => {
    const key = name === 'azure' ? 'azure-ai-search' : name;
    if (key && SAMPLES[key]) {
      const sample = SAMPLES[key];
      setPricing(sample.getPricing());
      setCurrentTitle(sample.title);
      setDatasheet(sample.datasheet || null);
    } else {
      setPricing(null);
      setCurrentTitle('Unknown Sample');
      setDatasheet(null);
    }
  }, [name]);

  return (
    <>
      <Helmet>
        <title> SPHERE - {currentTitle} (sample) </title>
      </Helmet>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            {currentTitle} (sample)
          </Typography>

          <Typography variant="body1" color="text.secondary" mb={4}>
            This is a local sample pricing file included for demonstrations and testing.
          </Typography>

          {datasheet && <ApiDatasheet data={datasheet} />}

          {pricing ? (
            <PricingRenderer pricing={pricing} errors={[]} />
          ) : (
            <Typography color="text.secondary">
              Unable to find or parse sample pricing "{name}".
            </Typography>
          )}
        </Box>
      </Container>
    </>
  );
}
