import { Box, Chip, Divider, Grid, Link, Paper, Typography } from '@mui/material';
import YAML from 'js-yaml';

type Props = {
  content: string | null;
};

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return !!obj && typeof obj === 'object' && !Array.isArray(obj);
}

function renderPrimitive(k: string, value: any) {
  if (value === null || value === undefined) return <Typography color="text.secondary">-</Typography>;
  if (k === 'url' && typeof value === 'string') {
    return (
      <Link href={value} target="_blank" rel="noreferrer" underline="hover">
        {value}
      </Link>
    );
  }
  if (k === 'associatedSaaS') {
    return <Chip label={String(value)} size="small" variant="outlined" sx={{ borderRadius: 99 }} />;
  }
  return <Typography>{String(value)}</Typography>;
}

function renderArray(arr: any[]) {
  // If array of objects, render each as a small Paper card
  if (arr.length > 0 && arr.every(isPlainObject)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {arr.map((item, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 1, bgcolor: 'background.paper' }}>
            <Grid container spacing={1}>
              {Object.entries(item).map(([ik, iv]) => (
                <Grid item xs={12} sm={6} key={ik}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{ik}</Typography>
                  {isPlainObject(iv) || Array.isArray(iv) ? (
                    <Typography variant="body2">{JSON.stringify(iv)}</Typography>
                  ) : (
                    renderPrimitive(ik, iv)
                  )}
                </Grid>
              ))}
            </Grid>
          </Paper>
        ))}
      </Box>
    );
  }

  // otherwise render as simple bullets
  return (
    <Box component="ul" sx={{ pl: 2, m: 0 }}>
      {arr.map((v, i) => (
        <li key={i}>
          {isPlainObject(v) ? (
            <Typography variant="body2">{Object.entries(v).map(([kk, vv]) => `${kk}: ${String(vv)}`).join(' · ')}</Typography>
          ) : (
            <Typography variant="body2">{String(v)}</Typography>
          )}
        </li>
      ))}
    </Box>
  );
}

function renderValue(k: string, value: any) {
  if (value === null || value === undefined) return <Typography color="text.secondary">-</Typography>;

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return renderPrimitive(k, value);
  }

  if (Array.isArray(value)) {
    return renderArray(value);
  }

  if (isPlainObject(value)) {
    return (
      <Grid container spacing={1}>
        {Object.entries(value).map(([ik, iv]) => (
          <Grid item xs={12} key={ik}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{ik}</Typography>
            {Array.isArray(iv) ? renderArray(iv) : (isPlainObject(iv) ? <Typography variant="body2">{JSON.stringify(iv)}</Typography> : renderPrimitive(ik, iv))}
          </Grid>
        ))}
      </Grid>
    );
  }

  return <Typography>{String(value)}</Typography>;
}

export default function DatasheetViewer({ content }: Props) {
  if (!content) {
    return <Typography>Loading...</Typography>;
  }

  // short-circuit for known messages
  if (content === 'Datasheet not found for plan' || content.startsWith('Error')) {
    return <Typography color="error">{content}</Typography>;
  }

  let doc: any = null;
  try {
    doc = YAML.load(content);
  } catch (e) {
    // fallback: render as raw text
    return (
      <Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{content}</Typography>
      </Box>
    );
  }

  if (!doc || typeof doc !== 'object') {
    return <Typography>{String(doc ?? content)}</Typography>;
  }

  // Header info
  const title = doc.name || doc.plan || doc.title || null;
  const subtitle = doc.subtitle || doc.type || null;
  const highlightKeys = ['planReference', 'type', 'tier', 'price', 'sla'];

  return (
    <Box sx={{ mt: 1 }} role="region" aria-label={title ? `Datasheet for ${title}` : 'Datasheet'}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
        {title && <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>}
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {highlightKeys.map(k => k in doc ? (
            <Chip key={k} label={`${k}: ${String(doc[k])}`} size="small" variant="outlined" />
          ) : null)}
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Render top-level keys with nicer formatting */}
      <Grid container spacing={2}>
        {Object.entries(doc).map(([k, v]) => (
          <Grid item xs={12} sm={6} key={k}>
            <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.primary', textTransform: 'capitalize' }}>{k}</Typography>
            {k === 'features' && isPlainObject(v) ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.keys(v).map(fk => (
                  <Chip key={fk} label={fk} size="small" sx={{ borderRadius: 999 }} />
                ))}
              </Box>
            ) : (
              renderValue(k, v)
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
