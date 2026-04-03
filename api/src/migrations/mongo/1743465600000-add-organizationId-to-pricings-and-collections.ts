import type { Connection } from 'mongoose';
import mongoose from 'mongoose';
import { getMongoDBConnectionURI } from '../../config/mongoose';

/**
 * Backfills _organizationId on existing pricings and collections.
 *
 * Strategy:
 * - For each Pricing: find the User whose username matches the `owner` field,
 *   then find their personal Organization, and set _organizationId.
 * - For each PricingCollection: find the personal Organization for the document's
 *   _ownerId (userId) and set _organizationId.
 *
 * Documents that already have _organizationId are skipped.
 */
export async function up(connection: Connection): Promise<void> {
  await mongoose.connect(getMongoDBConnectionURI());

  const db = mongoose.connection.db!;
  const users = db.collection('users');
  const organizations = db.collection('organizations');
  const memberships = db.collection('organizationmemberships');
  const pricings = db.collection('pricings');
  const collections = db.collection('pricingCollections');

  // Build a map: userId (string) → personal organizationId (ObjectId)
  const personalOrgByUserId = new Map<string, mongoose.Types.ObjectId>();

  const allMemberships = await memberships.find({}).toArray();
  for (const m of allMemberships) {
    const org = await organizations.findOne({ _id: m._organizationId, isPersonal: true });
    if (org) {
      personalOrgByUserId.set(m._userId.toString(), org._id as mongoose.Types.ObjectId);
    }
  }

  // --- Pricings: match owner (username) → user → personal org ---
  const pricingsWithoutOrg = await pricings.find({ _organizationId: { $exists: false } }).toArray();

  for (const pricing of pricingsWithoutOrg) {
    const user = await users.findOne({ username: pricing.owner });
    if (!user) continue;

    const orgId = personalOrgByUserId.get(user._id.toString());
    if (!orgId) continue;

    await pricings.updateOne({ _id: pricing._id }, { $set: { _organizationId: orgId } });
  }

  // --- PricingCollections: match _ownerId → personal org ---
  const collectionsWithoutOrg = await collections
    .find({ _organizationId: { $exists: false } })
    .toArray();

  for (const col of collectionsWithoutOrg) {
    const orgId = personalOrgByUserId.get(col._ownerId.toString());
    if (!orgId) continue;

    await collections.updateOne({ _id: col._id }, { $set: { _organizationId: orgId } });
  }
}

export async function down(connection: Connection): Promise<void> {
  await mongoose.connect(getMongoDBConnectionURI());

  const db = mongoose.connection.db!;
  await db.collection('pricings').updateMany({}, { $unset: { _organizationId: '' } });
  await db.collection('pricingCollections').updateMany({}, { $unset: { _organizationId: '' } });
}
