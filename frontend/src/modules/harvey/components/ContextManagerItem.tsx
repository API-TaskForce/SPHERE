import { Alert, Button, CircularProgress, ListItem, Stack, Typography } from '@mui/material';
import { PricingContextItem } from '../types/types';
import { Box } from '@mui/system';
import { grey } from '@mui/material/colors';
import { OpenInNew } from '@mui/icons-material';

const HARVEY_API_BASE_URL = import.meta.env.VITE_HARVEY_URL ?? 'http://localhost:8086';

interface ContextManagerItemProps {
  item: PricingContextItem;
  onRemove: (id: string) => void;
}

function computeOriginLabel(pricingContextItem: PricingContextItem): string {
  switch (pricingContextItem.origin) {
    case 'user':
      return 'Manual';
    case 'detected':
      return 'Detected';
    case 'preset':
      return 'Preset';
    case 'agent':
      return 'Agent';
    case 'sphere':
      return 'SPHERE';
    default:
      return '';
  }
}

function computeContextItemMetadata(pricingContextItem: PricingContextItem): string {
  let res = `${pricingContextItem.kind.toUpperCase()} · ${computeOriginLabel(pricingContextItem)} `;
  switch (pricingContextItem.origin) {
    case 'agent':
    case 'detected':
    case 'preset':
    case 'user': {
      return res;
    }
    case 'sphere': {
      res += `· ${pricingContextItem.owner} · ${pricingContextItem.version}`;
      return res;
    }
    default:
      return '';
  }
}

function ContextManagerItem({ item, onRemove }: ContextManagerItemProps) {
  const formatSphereEditorLink = (url: string) => `/editor?pricingUrl=${url}`;

  const formatEditorLink = (): string => {
    switch (item.origin) {
      case 'preset':
      case 'user':
      case 'detected':
      case 'agent':
        return formatSphereEditorLink(`https:/${import.meta.env.VITE_SPHERE_URL}${HARVEY_API_BASE_URL}/static/${item.id}.yaml`);
      case 'sphere':
        return formatSphereEditorLink(item.yamlPath);
      default:
        return '#';
    }
  };

  const isSphereEditorLinkEnabled =
    item.kind === 'yaml' || (item.kind === 'url' && item.transform === 'done');

  return (
    <ListItem
      key={item.id}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1,
        px: 0,
        borderBottom: `1px solid ${grey[200]}`,
      }}
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {item.label}
        </Typography>
        <Typography variant="caption" sx={{ color: grey[600] }}>
          {computeContextItemMetadata(item)}
        </Typography>
        {item.kind === 'url' && item.transform === 'not-started' && (
          <Alert severity="info">URL waiting to be processed by A-MINT...</Alert>
        )}
      </Box>
      <Stack direction="row" spacing={2}>
        <Button size="small" onClick={() => onRemove(item.id)} color="error">
          Remove
        </Button>
        {isSphereEditorLinkEnabled && (
          <Button
            size="small"
            variant="text"
            target="_blank"
            href={formatEditorLink()}
            startIcon={<OpenInNew />}
          >
            Open in editor
          </Button>
        )}
        {item.kind === 'url' && item.transform === 'pending' && <CircularProgress size="30px" />}
      </Stack>
    </ListItem>
  );
}

export default ContextManagerItem;
