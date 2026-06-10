import type { PromptPreset } from './types/types';

/**
 * Starter prompts oriented to APIs and SPHERE datasheets. They carry no inline
 * context: the user is expected to attach a datasheet (uploaded or from SPHERE)
 * before asking, or to use them as inspiration for their own question.
 */
export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'datasheet-summary',
    label: 'Summarize the capabilities exposed by a datasheet',
    description:
      'Get a concise overview of the plans, limits and capabilities described in the attached datasheet.',
    question:
      'Summarize the attached datasheet: list its plans, the main capabilities and the usage limits for each tier.',
    context: [],
  },
  {
    id: 'datasheet-rate-limits',
    label: 'Compare API rate limits and usage limits across tiers',
    description:
      'Compare the consumption units and usage limits defined in the datasheet across the available plans.',
    question:
      'From the attached datasheet, list each plan together with its API rate limits and usage limits, and indicate which tier offers the highest capacity.',
    context: [],
  },
  {
    id: 'datasheet-best-fit',
    label: 'Recommend the best tier for a given API usage profile',
    description:
      'Find the most suitable plan for a specific API consumption profile based on the datasheet.',
    question:
      'Using the attached datasheet, which plan is the best fit for an integration that needs roughly 50,000 API requests per day and webhook support? Explain the trade-offs.',
    context: [],
  },
];
