import { vi } from 'vitest';

const originalWarn = console.warn.bind(console);

vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
  const message = args.map(String).join(' ');
  const isExpectedMiniZincWarning =
    message.includes('MiniZinc not found in PATH, skipping analytics') ||
    message.includes('Analytics computation skipped: no solver with tag gecode found');

  if (isExpectedMiniZincWarning) return;

  originalWarn(...args);
});
