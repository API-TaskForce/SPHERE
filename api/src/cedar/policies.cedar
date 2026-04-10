// ════════════════════════════════════════════════════════════════
// SPHERE — Cedar Authorization Policies
// ════════════════════════════════════════════════════════════════
//
// Contexto que el middleware construye antes de cada llamada:
//
//   Acciones sobre Organization (OrgContext):
//     { orgRole: "owner"|"admin"|"member"|"none" }
//
//   Acciones sobre Group (GroupContext):
//     { orgRole, groupRole, parentGroupRole, isRootGroup }
//
//   createCollection (CreateCollectionContext):
//     { orgRole, groupRole }
//     — resource Organization: groupRole = "none"
//     — resource Group:        groupRole = rol del usuario en ese grupo concreto
//
//   Acciones sobre PricingCollection / Pricing (ResourceContext):
//     { orgRole, effectiveRole, isCreator }
//     effectiveRole resuelto antes de llamar a Cedar:
//       GroupCollection.accessRole si existe para algún grupo del usuario → ese valor
//       si no → GroupMembership.role en el grupo vinculado a la colección
//       entre varios grupos: el más permisivo
//
// Default deny: Cedar deniega cualquier acción no cubierta por un permit.
// ════════════════════════════════════════════════════════════════


// ── Cobertura universal: owner y admin de la organización ────────

// El owner tiene acceso completo a todas las operaciones sin excepción
permit (principal is SPHERE::User, action, resource)
when { context.orgRole == "owner" };

// El admin tiene acceso a todas las operaciones excepto las reservadas al owner
permit (principal is SPHERE::User, action, resource)
when { context.orgRole == "admin" };

// Dos operaciones son exclusivas del owner: el admin queda explícitamente excluido
forbid (
  principal is SPHERE::User,
  action in [
    SPHERE::Action::"deleteOrganization",
    SPHERE::Action::"manageSubscription"
  ],
  resource is SPHERE::Organization
) when { context.orgRole == "admin" };


// ── Organización ────────────────────────────────────────────────

// Cualquier usuario autenticado puede crear organizaciones (owner/admin ya cubiertos)
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"createOrganization",
  resource is SPHERE::Organization
);

// Cualquier miembro puede consultar la organización (owner/admin ya cubiertos)
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"readOrganization",
  resource is SPHERE::Organization
) when { context.orgRole == "member" };


// ── Grupos ──────────────────────────────────────────────────────

// Cualquier miembro puede consultar grupos (owner/admin ya cubiertos)
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"readGroup",
  resource is SPHERE::Group
) when { context.orgRole == "member" };

// El admin del grupo puede crear subgrupos y gestionar el grupo, sus miembros y sus colecciones
permit (
  principal is SPHERE::User,
  action in [
    SPHERE::Action::"createSubgroup",
    SPHERE::Action::"updateGroup",
    SPHERE::Action::"manageGroupMembers",
    SPHERE::Action::"manageGroupCollections"
  ],
  resource is SPHERE::Group
) when { context.groupRole == "admin" };

// Eliminar subgrupos: el admin del grupo padre también puede hacerlo
// (eliminar grupos raíz es exclusivo de owner/admin org, ya cubiertos)
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"deleteGroup",
  resource is SPHERE::Group
) when { !context.isRootGroup && context.parentGroupRole == "admin" };


// ── Colecciones ─────────────────────────────────────────────────

// Colección organizacional (resource = Organization): solo owner/admin, ya cubiertos

// Colección de grupo (resource = Group): admin o editor del grupo concreto
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"createCollection",
  resource is SPHERE::Group
) when { context.groupRole == "admin" || context.groupRole == "editor" };

// Cualquier rol con acceso efectivo puede leer la colección
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"readCollection",
  resource is SPHERE::PricingCollection
) when {
  context.effectiveRole == "admin"  ||
  context.effectiveRole == "editor" ||
  context.effectiveRole == "viewer"
};

// Admin_G y editor pueden modificar los metadatos de la colección
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"updateCollection",
  resource is SPHERE::PricingCollection
) when { context.effectiveRole == "admin" || context.effectiveRole == "editor" };

// Admin_G puede eliminar siempre; editor solo si es el creador de la colección
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"deleteCollection",
  resource is SPHERE::PricingCollection
) when {
  context.effectiveRole == "admin" ||
  (context.effectiveRole == "editor" && context.isCreator)
};


// ── Pricings ────────────────────────────────────────────────────

// Crear pricing standalone (sin colección): requiere ser admin/editor de algún grupo,
// además de owner/admin de org que ya están cubiertos por las políticas globales
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"createPricing",
  resource is SPHERE::Organization
) when { context.orgRole == "member" && context.hasGroupEditorRole };

// Admin_G y editor pueden crear pricings en la colección (añadir pricing a colección)
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"createPricing",
  resource is SPHERE::PricingCollection
) when { context.effectiveRole == "admin" || context.effectiveRole == "editor" };

// Cualquier rol con acceso efectivo puede leer pricings
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"readPricing",
  resource is SPHERE::Pricing
) when {
  context.effectiveRole == "admin"  ||
  context.effectiveRole == "editor" ||
  context.effectiveRole == "viewer"
};

// Admin_G y editor pueden modificar pricings
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"updatePricing",
  resource is SPHERE::Pricing
) when { context.effectiveRole == "admin" || context.effectiveRole == "editor" };

// Admin_G puede eliminar siempre; editor solo si es el creador del pricing
permit (
  principal is SPHERE::User,
  action == SPHERE::Action::"deletePricing",
  resource is SPHERE::Pricing
) when {
  context.effectiveRole == "admin" ||
  (context.effectiveRole == "editor" && context.isCreator)
};
