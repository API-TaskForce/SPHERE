import './styles.css';
import { PricingProps } from './types.d';
import FeatureTableV2 from './components/FeatureTableV2';
import PricingCard from './components/pricing-card';
const CURRENCIES = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  SEK: 'kr',
  NZD: 'NZ$',
};

import DEFAULT_RENDERING_STYLES from './shared/constants';
import AddOnElement from './components/addon-element';
import { useState } from 'react';
import VariablesEditor from './components/VariablesEditor';
import datasheetsIndex from '../../../harvey/samples/datasheets';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography } from '@mui/material';

export function PricingRenderer({
  pricing,
  style,
  onApplyVariables,
}: Readonly<PricingProps>): JSX.Element {
  style ??= {};
  const [variablesModalOpen, setVariablesModalOpen] = useState(false);

  // Datasheet viewer state
  const [datasheetOpen, setDatasheetOpen] = useState(false);
  const [datasheetContent, setDatasheetContent] = useState<string | null>(null);
  const [selectedPlanKey, setSelectedPlanKey] = useState<string | null>(null);

  // Helper: load datasheet file from samples/datasheets using import.meta.glob
  async function loadDatasheetForPlan(planKey: string) {
    try {
      // Use static index of datasheets to avoid glob issues
      const modules = datasheetsIndex as Record<string, string>;
      // debug static index keys
      // eslint-disable-next-line no-console
      console.debug('Datasheet static keys:', Object.keys(modules));
      const planNorm = planKey.toLowerCase().replace(/_/g, '-');
      const saasTokens = (pricing.saasName || '').toLowerCase().split(/\s+/).filter(Boolean);

      // Prefer file that contains both plan and one token from saasName
      const candidates = Object.keys(modules);
      // debug info to help diagnose missing matches
      // eslint-disable-next-line no-console
      console.debug('Datasheet loader candidates:', candidates);
      // exact lookups are case-insensitive
      const planNormLower = planNorm.toLowerCase();
      const saasTokensLower = saasTokens.map(t => t.toLowerCase());

      let matched = candidates.find(k => k.toLowerCase().includes(planNormLower) && saasTokensLower.some(t => k.toLowerCase().includes(t) || k.toLowerCase().includes(`${t}-`)));

      if (!matched) {
        // fallback: match by plan only
        matched = candidates.find(k => k.toLowerCase().includes(planNormLower));
      }

      if (!matched) {
        // try looser match: remove hyphens/underscores from plan and filename base
        const planNormalizedCompact = planNormLower.replace(/[-_]/g, '');
        matched = candidates.find(k => {
          const base = k.split('/').pop() || k;
          const compactBase = base.replace(/[-_\.]/g, '').toLowerCase();
          return compactBase.includes(planNormalizedCompact);
        });
      }

      if (!matched) {
        // eslint-disable-next-line no-console
        console.warn(`No datasheet matched for plan ${planKey}. Candidates: ${candidates.join(', ')}`);
        setDatasheetContent('Datasheet not found for plan');
        setSelectedPlanKey(planKey);
        setDatasheetOpen(true);
        return;
      }

      // static content is a string mapped by filename
      const content = modules[matched];
      setDatasheetContent(content);
      setSelectedPlanKey(planKey);
      setDatasheetOpen(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading datasheet for plan', planKey, err);
      setDatasheetContent('Error loading datasheet');
      setSelectedPlanKey(planKey);
      setDatasheetOpen(true);
    }
  }

  return (
    <section
      style={{
        backgroundColor: style.backgroundColor ?? DEFAULT_RENDERING_STYLES.backgroundColor,
      }}
    >
      <div className="container">
        <PricingCard pricing={pricing} style={style} defaultStyle={DEFAULT_RENDERING_STYLES} />

        {/* Variables editor trigger - placed before features table */}

        {Object.keys(pricing.variables).length > 0 && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 12,
                marginBottom: 6,
              }}
            >
              <Button variant="outlined" size="small" onClick={() => setVariablesModalOpen(true)}>
                Open variables calculator
              </Button>
            </div>
            <VariablesEditor
              open={variablesModalOpen}
              onClose={() => setVariablesModalOpen(false)}
              variables={pricing.variables}
              onApply={variables => {
                if (onApplyVariables) onApplyVariables(variables);
              }}
            />
          </>
        )}

        <FeatureTableV2
          plans={pricing.plans ?? {}}
          features={pricing.features ?? {}}
          usageLimits={pricing.usageLimits ?? {}}
          addOns={pricing.addOns ?? {}}
          currency={
            pricing.currency in CURRENCIES
              ? CURRENCIES[pricing.currency as keyof typeof CURRENCIES]
              : pricing.currency
          }
          onPlanClick={(planKey: string) => loadDatasheetForPlan(planKey)}
        />

        {pricing.addOns && Object.values(pricing.addOns).length > 0 && (
          <>
            <div
              className="pricing-page-title"
              style={{ color: style.headerColor ?? DEFAULT_RENDERING_STYLES.headerColor }}
            >
              <h1>Add-Ons</h1>
            </div>
            <div className="add-ons-container" style={{ marginBottom: '100px' }}>
              {Object.values(pricing.addOns).map(addOn => (
                <AddOnElement
                  addOn={addOn}
                  currency={
                    pricing.currency in CURRENCIES
                      ? CURRENCIES[pricing.currency as keyof typeof CURRENCIES]
                      : pricing.currency
                  }
                  style={style}
                  key={addOn.name}
                />
              ))}
            </div>
          </>
        )}

        {/* Datasheet dialog */}
        <Dialog open={datasheetOpen} onClose={() => setDatasheetOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Datasheet {selectedPlanKey ? `- ${selectedPlanKey}` : ''}</DialogTitle>
          <DialogContent>
            <DialogContentText component="div">
              {datasheetContent ? (
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{datasheetContent}</pre>
              ) : (
                <Typography>Loading...</Typography>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDatasheetOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </div>
    </section>
  );
}
