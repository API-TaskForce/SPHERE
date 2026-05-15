import type { Connection } from 'mongoose'
import mongoose from 'mongoose';
import { getMongoDBConnectionURI } from '../../config/mongoose';

export async function up (connection: Connection): Promise<void> {
  mongoose.connect(getMongoDBConnectionURI());

  const collection = connection.collection('pricingCollections');
  const indexes = await collection.indexes();

  const oldIndexName = 'name_1__ownerId_1';
  const newIndexName = 'name_1__ownerId_1__organizationId_1';

  if (indexes.some(i => i.name === oldIndexName)) {
    await collection.dropIndex(oldIndexName);
  }

  if (!indexes.some(i => i.name === newIndexName)) {
    await collection.createIndex({ name: 1, _ownerId: 1, _organizationId: 1 }, { unique: true });
  }
}

export async function down (connection: Connection): Promise<void> {
  mongoose.connect(getMongoDBConnectionURI());

  const collection = connection.collection('pricingCollections');
  const indexes = await collection.indexes();

  const currentIndexName = 'name_1__ownerId_1__organizationId_1';
  const previousIndexName = 'name_1__ownerId_1';

  if (indexes.some(i => i.name === currentIndexName)) {
    await collection.dropIndex(currentIndexName);
  }

  if (!indexes.some(i => i.name === previousIndexName)) {
    await collection.createIndex({ name: 1, _ownerId: 1 }, { unique: true });
  }
}
