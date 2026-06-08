/**
 * Helpers to pull datasheet YAML out of the SPHERE datasheet repository so it can
 * be attached as grounding context for HARVEY4API.
 */

function resolveDatasheetYamlUrl(yamlPath: string): string {
  if (/^https?:\/\//i.test(yamlPath)) {
    try {
      const parsedUrl = new URL(yamlPath);
      if (parsedUrl.pathname.startsWith('/public/')) {
        parsedUrl.pathname = parsedUrl.pathname.replace('/public/', '/');
      }
      return parsedUrl.toString();
    } catch {
      return yamlPath;
    }
  }
  const normalizedYamlPath = yamlPath.startsWith('/public/')
    ? yamlPath.replace('/public/', '/')
    : yamlPath.startsWith('public/')
      ? yamlPath.replace('public/', '')
      : yamlPath;
  if (normalizedYamlPath.startsWith('/')) return `${import.meta.env.VITE_API_URL}${normalizedYamlPath}`;
  return `${import.meta.env.VITE_API_URL}/${normalizedYamlPath}`;
}

export interface SphereDatasheetVersion {
  version: string;
  yamlPath: string;
}

/**
 * Fetch the raw YAML for the latest version of a SPHERE datasheet.
 */
export async function fetchSphereDatasheetYaml(
  owner: string,
  name: string,
  collectionName?: string | null
): Promise<{ yaml: string; version: string; yamlPath: string }> {
  const collectionQuery =
    collectionName && collectionName !== 'undefined'
      ? `?collectionName=${encodeURIComponent(collectionName)}`
      : '';

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/datasheets/${owner}/${name}${collectionQuery}`
  );
  if (!response.ok) {
    throw new Error(`Could not load datasheet ${owner}/${name}`);
  }

  const data = (await response.json()) as {
    versions?: Array<{ version?: string; yaml: string }>;
  };
  const latest = data.versions?.[0];
  if (!latest) {
    throw new Error(`Datasheet ${owner}/${name} has no versions`);
  }

  const yamlUrl = resolveDatasheetYamlUrl(latest.yaml);
  const yamlResponse = await fetch(yamlUrl);
  if (!yamlResponse.ok) {
    throw new Error(`Could not fetch datasheet YAML for ${owner}/${name}`);
  }
  const yaml = await yamlResponse.text();

  return { yaml, version: latest.version ?? 'latest', yamlPath: latest.yaml };
}
