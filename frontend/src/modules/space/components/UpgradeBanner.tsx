interface UpgradeBannerProps {
  feature: string;
  compact?: boolean;
}

export default function UpgradeBanner({ feature, compact = false }: UpgradeBannerProps) {
  if (compact) {
    return (
      <span
        title={`${feature} requires a PRO or ENTERPRISE plan`}
        className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
      >
        🔒 Upgrade to PRO
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span>🔒</span>
      <span>
        <strong>{feature}</strong> requires a PRO or ENTERPRISE plan.
      </span>
    </div>
  );
}
