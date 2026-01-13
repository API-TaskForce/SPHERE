import rawAzure from '../../harvey/samples/azure-ai-search.yaml?raw';
import { retrievePricingFromYaml, Pricing } from 'pricing4ts';

export function getAzureAiSearchPricing(): Pricing | null {
  try {
    return retrievePricingFromYaml(rawAzure);
  } catch (err) {
    // If parsing fails, log and return null so consumers can handle it gracefully
    // eslint-disable-next-line no-console
    console.error('Failed to parse Azure AI Search pricing YAML', err);
    return null;
  }
}

export const azureAiSearchYaml = rawAzure;
