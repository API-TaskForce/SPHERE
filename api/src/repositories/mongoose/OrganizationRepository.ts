import mongoose from 'mongoose';
import RepositoryBase from '../RepositoryBase';
import OrganizationMongoose from './models/OrganizationMongoose';

class OrganizationRepository extends RepositoryBase {
  async findById(id: string, ...args: any) {
    try {
      const org = await OrganizationMongoose.findById(id);
      return org ? org.toObject({ getters: true, virtuals: true, versionKey: false }) : null;
    } catch (err) {
      return null;
    }
  }

  async findAll(...args: any) {
    try {
      const orgs = await OrganizationMongoose.find();
      return orgs.map(org => org.toObject({ getters: true, virtuals: true, versionKey: false }));
    } catch (err) {
      return [];
    }
  }

  async findByName(name: string, ...args: any) {
    try {
      const org = await OrganizationMongoose.findOne({ name });
      return org ? org.toObject({ getters: true, virtuals: true, versionKey: false }) : null;
    } catch (err) {
      return null;
    }
  }

  async create(data: any, ...args: any) {
    const org = await new OrganizationMongoose(data).save();
    return org.toObject({ getters: true, virtuals: true, versionKey: false });
  }

  async update(id: string, data: any, ...args: any) {
    return OrganizationMongoose.findOneAndUpdate(
      { _id: id },
      data,
      { new: true }
    );
  }

  async destroy(id: string, ...args: any) {
    const result = await OrganizationMongoose.deleteOne({ _id: id });
    return result?.deletedCount === 1;
  }
}

export default OrganizationRepository;
