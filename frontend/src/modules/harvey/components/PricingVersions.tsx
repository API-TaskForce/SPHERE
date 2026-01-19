import { Box, Button, Chip, Divider, Typography } from '@mui/material';
import { usePricingContext } from '../hooks/usePricingContext';
import { usePricingVersions } from '../hooks/useVersion';
import { fetchPricingYaml } from '../sphere';
import { SphereContextItemInput } from '../types/types';
import PricingVersionLoader from './PricingVersionLoader';

interface PricingVersionProps {
  owner: string;
  name: string;
  collectionName?: string | null;
  onContextAdd: (input: SphereContextItemInput) => void;
  onContextRemove: (id: string) => void;
}

function PricingVersions({
  owner,
  name,
  collectionName,
  onContextAdd,
  onContextRemove,
}: PricingVersionProps) {
  const { loading, error, versions } = usePricingVersions(owner, name, collectionName);
  const pricingContextItems = usePricingContext();

  const isVersionIncludedInContext = (yamlPath: string) =>
    pricingContextItems.filter(
      item => item.origin && item.origin === 'sphere' && item.yamlPath === yamlPath
    ).length > 0;

  const totalVersions = versions?.versions.length;

  if (error) {
    return <div>Something went wrong...</div>;
  }

  if (loading) {
    return <PricingVersionLoader />;
  }

  const calculateLabel = (name: string, collectionName?: string | null) =>
    `${collectionName ? collectionName + '/' : ''}${name}`;

  const calculateTotalVersionLabel = () => {
    const res = 'version';
    if (totalVersions === 1) {
      return res;
    }
    return res + 's';
  };

  const handleAddSpherePricing = async (sphereId: string, yamlUrl: string, version: string) => {
    const yamlFile = await fetchPricingYaml(yamlUrl);
    onContextAdd({
      sphereId: sphereId,
      kind: 'yaml',
      label: calculateLabel(name, collectionName),
      value: yamlFile,
      origin: 'sphere',
      owner: owner,
      yamlPath: yamlUrl,
      pricingName: name,
      version: version,
      collection: collectionName ?? null,
    });
  };

  return (
    <>
      {totalVersions && (
        <Chip size="small" label={`${totalVersions} ${calculateTotalVersionLabel()} available`} />
      )}
      <Box component="ul">
        {versions?.versions.map(item => (
          <Box
            component="li"
            key={item.id}
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
          >
            <Typography>{item.version}</Typography>
            {!isVersionIncludedInContext(item.yaml) ? (
              <Button
                variant="outlined"
                onClick={() => handleAddSpherePricing(item.id, item.yaml, item.version)}
              >
                Add
              </Button>
            ) : (
              <Button color="error" variant="outlined" onClick={() => onContextRemove(item.id)}>
                Remove
              </Button>
            )}
          </Box>
        ))}
      </Box>
      <Divider />
    </>
  );
}

export default PricingVersions;
