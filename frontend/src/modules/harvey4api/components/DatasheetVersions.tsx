import { usePricingContext } from '../../harvey/hooks/usePricingContext';
import type { SphereContextItemInput } from '../../harvey/types/types';
import { useDatasheetVersions } from '../hooks/useDatasheetVersions';

function resolveDatasheetYamlUrl(yamlPath: string) {
  if (/^https?:\/\//i.test(yamlPath)) {
    try {
      const parsed = new URL(yamlPath);
      if (parsed.pathname.startsWith('/public/')) {
        parsed.pathname = parsed.pathname.replace('/public/', '/');
      }
      return parsed.toString();
    } catch {
      return yamlPath;
    }
  }
  const normalized = yamlPath.startsWith('/public/')
    ? yamlPath.replace('/public/', '/')
    : yamlPath.startsWith('public/')
      ? yamlPath.replace('public/', '')
      : yamlPath;
  if (normalized.startsWith('/')) return `${import.meta.env.VITE_API_URL}${normalized}`;
  return `${import.meta.env.VITE_API_URL}/${normalized}`;
}

interface Props {
  owner: string;
  name: string;
  collectionName?: string | null;
  onContextAdd: (input: SphereContextItemInput) => void;
  onContextRemove: (id: string) => void;
}

function DatasheetVersions({ owner, name, collectionName, onContextAdd, onContextRemove }: Props) {
  const { loading, error, versions } = useDatasheetVersions(owner, name, collectionName);
  const contextItems = usePricingContext();

  const isInContext = (yamlPath: string) =>
    contextItems.some(
      item => item.origin === 'sphere' && 'yamlPath' in item && item.yamlPath === yamlPath
    );

  if (error) return <div>Something went wrong...</div>;
  if (loading) return <div className="h-16 animate-pulse rounded-xl bg-slate-100" />;

  const totalVersions = versions?.versions.length ?? 0;
  const label = collectionName ? `${collectionName}/${name}` : name;

  const handleAdd = async (id: string, yamlPath: string, version: string) => {
    const resolvedUrl = resolveDatasheetYamlUrl(yamlPath);
    const response = await fetch(resolvedUrl);
    if (!response.ok) throw new Error(`Could not fetch datasheet YAML: ${response.status}`);
    const yamlContent = await response.text();
    onContextAdd({
      sphereId: id,
      kind: 'yaml',
      label,
      value: yamlContent,
      origin: 'sphere',
      owner,
      yamlPath,
      pricingName: name,
      version,
      collection: collectionName ?? null,
    });
  };

  return (
    <>
      {totalVersions > 0 && (
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm">
          {totalVersions} {totalVersions === 1 ? 'version' : 'versions'} available
        </span>
      )}
      <ul className="mt-3 space-y-2">
        {versions?.versions.map(v => {
          const versionId = v._id ?? `${name}-${v.version}`;
          return (
            <li
              key={versionId}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-4 py-3"
            >
              <span>{v.version ?? 'N/A'}</span>
              {!isInContext(v.yaml) ? (
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50"
                  onClick={() => handleAdd(versionId, v.yaml, v.version ?? '')}
                >
                  Add
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-md border border-red-500 px-3 py-2 text-red-500 hover:bg-red-500 hover:text-white"
                  onClick={() => onContextRemove(versionId)}
                >
                  Remove
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 border-t border-slate-200" />
    </>
  );
}

export default DatasheetVersions;
