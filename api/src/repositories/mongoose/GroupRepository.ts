import mongoose from 'mongoose';
import RepositoryBase from '../RepositoryBase';
import GroupMongoose from './models/GroupMongoose';

class GroupRepository extends RepositoryBase {
  async findById(id: string, ...args: any) {
    try {
      const group = await GroupMongoose.findById(id);
      return group ? group.toObject({ getters: true, virtuals: true, versionKey: false }) : null;
    } catch (err) {
      return null;
    }
  }

  async findAll(...args: any) {
    try {
      const docs = await GroupMongoose.find().exec();
      return docs.map(doc => doc.toObject({ getters: true, virtuals: true, versionKey: false }));
    } catch (err) {
      return [];
    }
  }

  async findByOrganizationId(organizationId: string, ...args: any) {
    try {
      const docs = await GroupMongoose.find({
        _organizationId: new mongoose.Types.ObjectId(organizationId),
      }).exec();
      return docs.map(doc => doc.toObject({ getters: true, virtuals: true, versionKey: false }));
    } catch (err) {
      return [];
    }
  }

  async findByParentGroupId(parentGroupId: string, ...args: any) {
    try {
      const docs = await GroupMongoose.find({
        _parentGroupId: new mongoose.Types.ObjectId(parentGroupId),
      }).exec();
      return docs.map(doc => doc.toObject({ getters: true, virtuals: true, versionKey: false }));
    } catch (err) {
      return [];
    }
  }

  async findByNameAndOrganizationId(name: string, organizationId: string, ...args: any) {
    try {
      const group = await GroupMongoose.findOne({
        name,
        _organizationId: new mongoose.Types.ObjectId(organizationId),
      });
      return group ? group.toObject({ getters: true, virtuals: true, versionKey: false }) : null;
    } catch (err) {
      return null;
    }
  }

  async create(data: any, ...args: any) {
    const group = await new GroupMongoose(data).save();
    return group.toObject({ getters: true, virtuals: true, versionKey: false });
  }

  async update(id: string, data: any, ...args: any) {
    // Use $set for partial updates — passing the plain object without $set
    // causes a full document replacement in MongoDB, wiping unspecified fields.
    return GroupMongoose.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    );
  }

  async destroy(id: string, ...args: any) {
    const result = await GroupMongoose.deleteOne({ _id: id });
    return result?.deletedCount === 1;
  }

  async destroyByOrganizationId(organizationId: string, ...args: any) {
    const result = await GroupMongoose.deleteMany({
      _organizationId: new mongoose.Types.ObjectId(organizationId),
    });
    return result?.deletedCount > 0;
  }
}

export default GroupRepository;
