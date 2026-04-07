import { useSpaceSync } from '../hooks/useSpaceSync';

/**
 * Renderless component that syncs the SPACE client with the active organization.
 * Place it inside OrganizationProvider so it has access to OrganizationContext.
 *
 * Usage example with the <Feature> component:
 *
 *   import { Feature, On, Default, Loading } from 'space-react-client';
 *
 *   <Feature id="sphere-bulkImport">
 *     <On><BulkImportButton /></On>
 *     <Default><UpgradeBanner feature="Bulk Import" /></Default>
 *     <Loading><Skeleton /></Loading>
 *   </Feature>
 */
export default function SpaceSync() {
  useSpaceSync();
  return null;
}
