import { UsageLimit } from 'pricing4ts';
import { pluralizeUnit } from '../../../services/pricing.service';
import { camelToTitle } from './stringUtils';

function formatNumberValue(value: number, unit?: string): string | number {
  if (value === 0) return '-';
  const unitText = value > 1 ? pluralizeUnit(unit ?? '') : unit;
  return `${value} ${unitText}`;
}

function applyAddonAdjustment(
  baseValue: number,
  addonValue?: number | null,
  addonExtension?: boolean
): number {
  if (addonValue && typeof addonValue === 'number' && addonValue !== 0) {
    return addonExtension ? baseValue - addonValue : baseValue;
  }
  return baseValue;
}

export function formatPricingValue(
  value: string | number,
  unit?: string,
  addonValue?: number | null,
  addonExtension?: boolean
): string | number {
  if (typeof value === 'number') {
    const adjusted = applyAddonAdjustment(value, addonValue, addonExtension);
    return formatNumberValue(adjusted, unit);
  }

  // fallback for non-number values
  return value;
}

export function formatUsageDisplay(limitValue: unknown, linkedLimit?: UsageLimit): string {
  // Render usage limit with dynamic unit + period formatting.
  // Rules:
  // - If linkedLimit.period is absent: render "{value} {unit?}" (unit pluralized if value>1)
  // - If linkedLimit.period present: render "{value} {unitPlural} / {periodValue (only if >1)} {periodUnit (plural if periodValue>1)}"
  const value = (() => {
    if (limitValue === null || limitValue === undefined) return linkedLimit?.defaultValue ?? '';
    if (typeof limitValue === 'number' || typeof limitValue === 'string' || typeof limitValue === 'boolean') return limitValue;
    // object: try common keys
    const obj = limitValue as Record<string, unknown> | undefined;
    if (!obj) return linkedLimit?.defaultValue ?? _safePrimitive(limitValue);
    for (const key of ['value', 'amount', 'quantity', 'defaultValue', 'max', 'limit', 'count']) {
      const v = obj[key];
      if (typeof v === 'number' || typeof v === 'string') return v;
    }
    // fallback: any first primitive
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === 'number' || typeof v === 'string') return v;
    }
    return linkedLimit?.defaultValue ?? _safePrimitive(limitValue);
  })();

  let unit = '';
  if (linkedLimit) {
    const lu = linkedLimit as unknown as Record<string, unknown>;
    if (typeof lu.unit === 'string') unit = lu.unit;
    else if (typeof lu.unitOfMeasure === 'string') unit = lu.unitOfMeasure;
    else if (typeof linkedLimit.name === 'string') unit = camelToTitle(linkedLimit.name);
  }
  // pluralize helper (very small): naive English pluralization by adding 's'
  const pluralize = (word: string, count: number | string | undefined) => {
    const n = typeof count === 'number' ? count : parseInt(String(count || '0')) || 0;
    if (!word) return '';
    return n > 1 ? `${word}s` : word;
  };

  const p = (linkedLimit as unknown as { period?: unknown })?.period as
    | undefined
    | { value?: unknown; unit?: unknown };

  const pieces: string[] = [];
  if (value !== '' && value !== undefined && value !== null) pieces.push(String(value));

  // If there's no period defined, just show value + unit (unit pluralized if value>1)
  if (!p) {
    if (unit) {
      // try numeric value for pluralization
      const nv = typeof value === 'number' ? value : parseInt(String(value || '0')) || 0;
      pieces.push(pluralize(unit, nv));
    }
    return pieces.join(' ').trim();
  }

  // period exists: render "{value} {unitPlural} / {period.value (only if >1)} {period.unit (plural if period.value>1)}"
  if (unit) {
    const nv = typeof value === 'number' ? value : parseInt(String(value || '0')) || 0;
    pieces.push(pluralize(unit, nv));
  }

  // build period suffix
  let periodSuffix = '';
  const periodValue = typeof p.value === 'number' ? p.value : parseInt(String(p.value ?? '0')) || 0;
  const periodUnitRaw = typeof p.unit === 'string' ? String(p.unit).toLowerCase() : '';
  if (periodValue > 1) {
    periodSuffix = `${periodValue} ${pluralize(periodUnitRaw, periodValue)}`.trim();
  } else if (periodUnitRaw) {
    periodSuffix = `${periodUnitRaw}`.trim();
  }

  const main = pieces.join(' ').trim();
  if (periodSuffix) return main ? `${main} / ${periodSuffix}` : periodSuffix;
  return main;
}

/**
 * Format a monetary value with the following rules:
 * - If the input is a numeric-looking string, return it unchanged (preserve YAML formatting).
 * - If the value is a number and >= 0.01: round to nearest cent (standard rounding) and show
 *   no decimals if whole, otherwise show 2 decimals.
 * - If the value is a number and < 0.01: show the actual decimal precision (e.g. 0.001, 0.0005)
 *   without forcing rounding up to cents.
 */
export function formatMoneyDisplay(value: unknown): string {
  // Preserve numeric-looking strings verbatim to respect the original YAML representation
  if (typeof value === 'string') {
    const s = value.trim();
    if (/^-?\d+(?:\.\d+)?$/.test(s)) return s;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 0) return '0';

    const abs = Math.abs(value);
    // Standard mode: >= 0.01 -> round to nearest cent
    if (abs >= 0.01) {
      const rounded2 = Math.round(value * 100) / 100;
      // If the value has more precision than 2 decimals (e.g. 2.9533), show full precision
      if (Math.abs(value - rounded2) > 1e-9) {
        return _numberToDecimalString(value);
      }
      // Otherwise keep standardized 2-decimal format (or integer)
      return Number.isInteger(rounded2) ? String(rounded2) : rounded2.toFixed(2);
    }

    // Small values: preserve actual precision without forcing to 2 decimals
    // Avoid exponential notation for very small numbers
    return _numberToDecimalString(value);
  }

  // fallback
  return String(value ?? '');
}

function _numberToDecimalString(n: number): string {
  // Fast path: if toString is already non-exponential, return it
  const s = n.toString();
  if (!s.includes('e')) return s;

  // Convert exponential to full decimal representation
  const m = n.toExponential().match(/^([+-]?[\d\.]+)e([+-]?\d+)$/i);
  if (!m) return s;
  const significand = m[1].replace('.', '').replace('+', '').replace('-', '');
  const sign = m[1].startsWith('-') ? '-' : '';
  const exp = Number(m[2]);

  if (exp >= 0) {
    const decimals = (m[1].split('.')[1] || '').length;
    const zerosToAdd = Math.max(0, exp - decimals);
    return sign + significand + '0'.repeat(zerosToAdd);
  }

  // exp < 0 -> produce 0.<zeros><significand>
  const zeros = Math.abs(exp) - 1;
  return sign + '0.' + '0'.repeat(zeros) + significand;
}

function _safePrimitive(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  // If it's an object that has a 'value' or 'defaultValue' property, prefer them
  if (typeof v === 'object' && v !== null) {
    try {
      const s = JSON.stringify(v);
      return s.length > 80 ? s.slice(0, 77) + '...' : s;
    } catch {
      return '[object]';
    }
  }
  return String(v as string | number | boolean);
}