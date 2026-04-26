import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { isAuthorized } from '@cedar-policy/cedar-wasm/nodejs';
import type { EntityJson, EntityUidJson, CedarValueJson, Context, SchemaJson } from '@cedar-policy/cedar-wasm/nodejs';
import container from '../config/container.js';
import type { OrganizationMembershipRepository } from '../types/repositories/OrganizationMembershipRepository.js';
import type { GroupMembershipRepository } from '../types/repositories/GroupMembershipRepository.js';
import type { GroupCollectionRepository } from '../types/repositories/GroupCollectionRepository.js';
import type { GroupRepository } from '../types/repositories/GroupRepository.js';

// ── Public types ─────────────────────────────────────────────────────────────

export type CedarAction =
  | 'createOrganization' | 'readOrganization' | 'updateOrganization'
  | 'deleteOrganization' | 'manageOrganizationMembers'
  /** Planned: subscription management (owner-only gate). No route wired yet. */
  | 'manageSubscription'
  | 'createGroup'        | 'createSubgroup'    | 'listSubgroups'
  | 'readGroup'          | 'updateGroup'       | 'deleteGroup'
  | 'manageGroupMembers' | 'manageGroupCollections' | 'manageGroupPricings'
  | 'createCollection'   | 'readCollection'    | 'updateCollection'
  | 'deleteCollection'
  | 'createPricing'      | 'readPricing'       | 'updatePricing'
  | 'deletePricing';

export type ResourceType = 'Organization' | 'Group' | 'PricingCollection' | 'Pricing';

export interface AuthorizationRequest {
  userId: string;
  organizationId: string;
  action: CedarAction;
  resource: { type: ResourceType; id: string };
  /**
   * Requerido para acciones sobre Pricing: ID de la colección que contiene el pricing,
   * necesario para resolver el effectiveRole del usuario sobre esa colección.
   */
  collectionId?: string;
  /**
   * ID del grupo al que pertenece el pricing directamente (sin colección).
   * Permite resolver el effectiveRole para pricings standalone de grupo.
   */
  groupId?: string;
  /**
   * ID del creador del recurso. Requerido para las acciones deleteCollection y deletePricing
   * cuando el usuario tiene effectiveRole "editor" (puede eliminar solo si es el creador).
   */
  creatorId?: string;
}

export interface AuthorizationDecision {
  allowed: boolean;
  /** IDs de las políticas Cedar que determinaron la decisión */
  reasons: string[];
  errors: string[];
}

// ── Internal types ───────────────────────────────────────────────────────────

type OrgRole       = 'owner' | 'admin' | 'member' | 'none';
type GroupRole     = 'admin' | 'editor' | 'viewer' | 'none';
type EffectiveRole = 'admin' | 'editor' | 'viewer' | 'none';
type CedarContext  = Record<string, CedarValueJson>;

const ROLE_RANK: Record<string, number> = { admin: 3, editor: 2, viewer: 1, none: 0 };

// ── Service ──────────────────────────────────────────────────────────────────

export default class AuthorizationService {
  private readonly organizationMembershipRepository: OrganizationMembershipRepository;
  private readonly groupMembershipRepository: GroupMembershipRepository;
  private readonly groupCollectionRepository: GroupCollectionRepository;
  private readonly groupRepository: GroupRepository;

  /** Contenido de policies.cedar y schema.cedarschema.json, cargados una sola vez */
  private readonly policiesText: string;
  private readonly schema: SchemaJson<string>;

  constructor() {
    this.organizationMembershipRepository = container.resolve('organizationMembershipRepository');
    this.groupMembershipRepository        = container.resolve('groupMembershipRepository');
    this.groupCollectionRepository        = container.resolve('groupCollectionRepository');
    this.groupRepository                  = container.resolve('groupRepository');

    const cedarDir = join(dirname(fileURLToPath(import.meta.url)), '../cedar');
    this.policiesText = readFileSync(join(cedarDir, 'policies.cedar'), 'utf-8');
    this.schema       = JSON.parse(readFileSync(join(cedarDir, 'schema.cedarschema.json'), 'utf-8'));
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async authorize(request: AuthorizationRequest): Promise<AuthorizationDecision> {
    const [context, entities] = await Promise.all([
      this.resolveContext(request),
      this.buildEntities(request),
    ]);

    const answer = isAuthorized({
      principal: { type: 'SPHERE::User',   id: request.userId },
      action:    { type: 'SPHERE::Action', id: request.action },
      resource:  { type: `SPHERE::${request.resource.type}`, id: request.resource.id },
      context: context as Context,
      policies:  { staticPolicies: this.policiesText },
      entities,
      schema:    this.schema,
      validateRequest: true,
    });

    if (answer.type === 'failure') {
      const msgs = answer.errors.map(e => e.message).join('; ');
      throw new Error(`Cedar engine failure: ${msgs}`);
    }

    const { decision, diagnostics } = answer.response;
    return {
      allowed: decision === 'allow',
      reasons: diagnostics.reason,
      errors:  diagnostics.errors.map(e => e.error.message),
    };
  }

  // ── Context resolution ─────────────────────────────────────────────────────

  private async resolveContext(request: AuthorizationRequest): Promise<CedarContext> {
    const { userId, organizationId, action, resource, creatorId } = request;

    const orgRole = await this.resolveOrgRole(userId, organizationId);

    // OrgContext — acciones cuyo resource es la organización
    if (resource.type === 'Organization') {
      // createCollection sobre org usa CreateCollectionContext (sin groupRole efectivo)
      if (action === 'createCollection') {
        return { orgRole, groupRole: 'none' };
      }
      // createPricing standalone: member necesita ser admin/editor en al menos un grupo
      if (action === 'createPricing') {
        const groupMemberships = await this.groupMembershipRepository.findByUserId(userId);
        const hasGroupEditorRole = groupMemberships.some(
          (gm: any) => gm.role === 'editor' || gm.role === 'admin'
        );
        return { orgRole, effectiveRole: 'none', isCreator: false, hasGroupEditorRole, isGroupRestricted: false };
      }
      return { orgRole };
    }

    // GroupContext / CreateCollectionContext / ResourceContext — acciones cuyo resource es un grupo
    if (resource.type === 'Group') {
      if (action === 'createCollection') {
        // CreateCollectionContext extendido: incluye parentGroupRole e isRootGroup para que
        // el admin/editor del grupo padre pueda crear colecciones en subgrupos directos.
        const group         = await this.groupRepository.findById(resource.id);
        const isRootGroup   = !group?._parentGroupId;
        const groupRole     = await this.resolveGroupRole(userId, resource.id);
        const parentGroupRole: GroupRole = isRootGroup
          ? 'none'
          : await this.resolveGroupRole(userId, group!._parentGroupId!);
        return { orgRole, groupRole, parentGroupRole, isRootGroup };
      }
      // createPricing on Group: check editor role both in the group and (for subgroups) in parent.
      // El admin/editor del grupo padre tiene capacidad equivalente sobre sus subgrupos directos.
      if (action === 'createPricing') {
        const group         = await this.groupRepository.findById(resource.id);
        const isRootGroup   = !group?._parentGroupId;
        const groupRole     = await this.resolveGroupRole(userId, resource.id);
        let hasGroupEditorRole = groupRole === 'admin' || groupRole === 'editor';
        if (!hasGroupEditorRole && !isRootGroup) {
          const parentGroupRole = await this.resolveGroupRole(userId, group!._parentGroupId!);
          hasGroupEditorRole = parentGroupRole === 'admin' || parentGroupRole === 'editor';
        }
        return { orgRole, effectiveRole: 'none', isCreator: false, hasGroupEditorRole, isGroupRestricted: false };
      }
      // GroupContext: incluye parentGroupRole e isRootGroup para deleteGroup y todas las
      // acciones que el admin del grupo padre puede realizar sobre subgrupos directos.
      // creatorId portado por el middleware para manageGroupCollections / manageGroupPricings.
      return this.resolveGroupContext(userId, orgRole, resource.id, request.creatorId);
    }

    // ResourceContext — acciones sobre PricingCollection o Pricing
    // For PricingCollection, resource.id IS the collection's own ID.
    // For Pricing, resource.id is the pricing's own ID — the collection that contains it
    // is carried separately in request.collectionId (set by CedarMiddleware).

    // Standalone org/group pricing: has no collection.
    // CedarMiddleware skips Cedar for personal pricings; reaching here means the pricing
    // belongs to an org or group. Resolve effectiveRole from direct group membership when
    // a groupId is available; otherwise mark as non-group-restricted (readable by any org member).
    if (resource.type === 'Pricing' && !request.collectionId) {
      const isCreator = Boolean(creatorId) && creatorId === userId;
      if (request.groupId) {
        // Standalone group pricing: effectiveRole = user's role in that specific group
        const effectiveRole = await this.resolveGroupRole(userId, request.groupId);
        return { orgRole, effectiveRole, isCreator, hasGroupEditorRole: false, isGroupRestricted: true };
      }
      // Standalone org pricing (no group): accessible to all org members
      return { orgRole, effectiveRole: 'none', isCreator, hasGroupEditorRole: false, isGroupRestricted: false };
    }

    const collectionId = resource.type === 'PricingCollection'
      ? resource.id
      : this.requireCollectionId(request);

    const [effectiveRole, isGroupRestricted] = await this.resolveEffectiveRoleAndGroupStatus(userId, collectionId);
    const isCreator = Boolean(creatorId) && creatorId === userId;

    return { orgRole, effectiveRole, isCreator, hasGroupEditorRole: false, isGroupRestricted };
  }

  private async resolveGroupContext(
    userId: string,
    orgRole: OrgRole,
    groupId: string,
    creatorId?: string,
  ): Promise<CedarContext> {
    const group       = await this.groupRepository.findById(groupId);
    const isRootGroup = !group?._parentGroupId;

    // isResourceOwner: true when the caller owns the resource being (un)assigned to/from the group.
    // Populated by CedarMiddleware for manageGroupCollections and manageGroupPricings DELETE routes.
    const isResourceOwner = Boolean(creatorId) && creatorId === userId;

    const [groupRole, parentGroupRole] = await Promise.all([
      this.resolveGroupRole(userId, groupId),
      isRootGroup ? Promise.resolve<GroupRole>('none') : this.resolveGroupRole(userId, group!._parentGroupId!),
    ]);

    return { orgRole, groupRole, parentGroupRole, isRootGroup, isResourceOwner };
  }

  // ── Role resolution helpers ────────────────────────────────────────────────

  private async resolveOrgRole(userId: string, organizationId: string): Promise<OrgRole> {
    const membership = await this.organizationMembershipRepository
      .findByUserAndOrganization(userId, organizationId);
    return (membership?.role as OrgRole) ?? 'none';
  }

  private async resolveGroupRole(userId: string, groupId: string): Promise<GroupRole> {
    const membership = await this.groupMembershipRepository
      .findByUserAndGroup(userId, groupId);
    return (membership?.role as GroupRole) ?? 'none';
  }

  /**
   * Resuelve el rol efectivo del usuario sobre una colección concreta.
   *
   * Orden de precedencia (de mayor a menor especificidad):
   *   1. GroupCollection.accessRole sobreescribe GroupMembership.role cuando existe.
   *   2. Si el usuario pertenece a varios grupos con acceso a la colección, gana el más permisivo.
   *   3. Si ningún grupo del usuario tiene acceso a la colección, el rol efectivo es "none".
   */
  async resolveEffectiveRole(userId: string, collectionId: string): Promise<EffectiveRole> {
    const [role] = await this.resolveEffectiveRoleAndGroupStatus(userId, collectionId);
    return role;
  }

  /**
   * Igual que resolveEffectiveRole pero también devuelve si la colección está asignada
   * a algún grupo (isGroupRestricted). Necesario para construir el contexto Cedar correcto:
   *   - isGroupRestricted = false → cualquier miembro de la org puede leer el recurso
   *   - isGroupRestricted = true  → solo miembros del grupo (effectiveRole != "none") o owner/admin
   */
  private async resolveEffectiveRoleAndGroupStatus(
    userId: string,
    collectionId: string,
  ): Promise<[EffectiveRole, boolean]> {
    const [groupMemberships, groupCollections] = await Promise.all([
      this.groupMembershipRepository.findByUserId(userId),
      this.groupCollectionRepository.findByPricingCollectionId(collectionId),
    ]);

    // isGroupRestricted: la colección pertenece a ≥1 grupo → acceso restringido a miembros de ese grupo
    const isGroupRestricted = groupCollections.length > 0;

    if (!groupMemberships.length || !groupCollections.length) return ['none', isGroupRestricted];

    const gcByGroupId = new Map(groupCollections.map(gc => [gc._groupId, gc]));

    let bestRole: EffectiveRole = 'none';

    for (const gm of groupMemberships) {
      const gc = gcByGroupId.get(gm._groupId);
      if (!gc) continue; // Este grupo no tiene acceso a esta colección

      // GroupCollection.accessRole sobreescribe GroupMembership.role si existe
      const role = (gc.accessRole ?? gm.role) as EffectiveRole;

      if ((ROLE_RANK[role] ?? 0) > (ROLE_RANK[bestRole] ?? 0)) {
        bestRole = role;
      }
    }

    return [bestRole, isGroupRestricted];
  }

  // ── Entity building ────────────────────────────────────────────────────────

  /**
   * Construye el conjunto mínimo de entidades Cedar necesario para la request.
   *
   * Las políticas de SPHERE son completamente context-based: ninguna condición
   * accede a atributos de entidad ni usa la jerarquía `in`. Los attrs y parents
   * vacíos son suficientes; Cedar solo necesita los UIDs para validar que las
   * entidades referenciadas en principal/action/resource existen en el store.
   */
  private buildEntities(request: AuthorizationRequest): EntityJson[] {
    const { userId, organizationId, resource } = request;

    const uid = (type: string, id: string): EntityUidJson => ({ type, id });

    const entities: EntityJson[] = [
      { uid: uid('SPHERE::User',         userId),         attrs: {}, parents: [] },
      { uid: uid('SPHERE::Organization', organizationId), attrs: {}, parents: [] },
    ];

    if (resource.type !== 'Organization') {
      entities.push({
        uid:     uid(`SPHERE::${resource.type}`, resource.id),
        attrs:   {},
        parents: [],
      });
    }

    return entities;
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private requireCollectionId(request: AuthorizationRequest): string {
    if (!request.collectionId) {
      throw new Error(
        `collectionId is required for action "${request.action}" on Pricing resources`
      );
    }
    return request.collectionId;
  }
}
