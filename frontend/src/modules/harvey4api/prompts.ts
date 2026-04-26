import type { PromptPreset } from '../harvey/types/types';

export const API_PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'find-best-api-plan-by-usage',
    label: 'Find the most cost-effective API plan for a given monthly request volume',
    description:
      'Identify the cheapest API plan that covers a specific number of monthly API calls without exceeding quota.',
    question:
      'Given the API datasheet, which plan offers the best value for a team expecting 500,000 API requests per month? Compare cost-per-request across all tiers.',
    context: [],
  },
  {
    id: 'compare-rate-limits',
    label: 'Compare rate limits and throughput caps across all API tiers',
    description: 'List and compare rate limits across all plans and highlight the best fit for high-throughput scenarios.',
    question:
      'From the API datasheet, compare the rate limits (requests per minute/hour/day) across all available plans and indicate which tier best fits a real-time, high-throughput integration.',
    context: [],
  },
  {
    id: 'api-overage-analysis',
    label: 'Analyze overage costs when exceeding the base quota',
    description: 'Calculate extra costs for going over the included quota and identify the most forgiving plan.',
    question:
      'Analyze the API datasheet for overage pricing. If a team regularly exceeds its base quota by 20%, which plan minimizes the additional monthly cost?',
    context: [],
  },
  {
    id: 'api-free-tier-evaluation',
    label: 'Evaluate whether the free tier is sufficient for prototyping',
    description: 'Check if the free or sandbox tier meets typical developer prototype workloads.',
    question:
      'Based on the API datasheet, is the free or trial tier sufficient for a developer building a prototype that makes around 1,000 requests per day? What key limitations should they be aware of before upgrading?',
    context: [],
  },
  {
    id: 'api-redundant-plans',
    label: 'Detect redundant or overlapping API plans',
    description: 'Inspect the datasheet for plans that offer identical or nearly identical limits and pricing.',
    question:
      'Review the API datasheet and identify any plans that have identical or nearly identical quotas and pricing. Suggest how the provider could simplify their tier structure.',
    context: [],
  },
];
