import rawApiFootball from '../../harvey/samples/api-football.yaml?raw';
import { retrievePricingFromYaml, Pricing } from 'pricing4ts';

export function getApiFootballPricing(): Pricing | null {
  try {
    return retrievePricingFromYaml(rawApiFootball);
  } catch (err) {
    // If parsing fails, log and return null so consumers can handle it gracefully
    // eslint-disable-next-line no-console
    console.error('Failed to parse API-Football pricing YAML', err);
    return null;
  }
}

export const apiFootballYaml = rawApiFootball;
