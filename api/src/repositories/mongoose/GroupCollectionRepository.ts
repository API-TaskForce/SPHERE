import mongoose from 'mongoose';
import RepositoryBase from '../RepositoryBase';
import GroupCollectionMongoose from './models/GroupCollectionMongoose';

class GroupCollectionRepository extends RepositoryBase {
  async findById(id: string, ...args: any) {
    try {
      const gc = await GroupCollectionMongoose.findById(id);
      return gc ? gc.toObject({ getters: true, virtuals: true, versionKey: false }) : null;
    } catch (err) {
      return null;
    }
  }

  async findByGroupId(groupId: string, ...args: any) {
    try {
      return await GroupCollectionMongoose.aggregate([
        { $match: { _groupId: new mongoose.Types.ObjectId(groupId) } },
        {
          $lookup: {
            from: 'pricingCollections',
            localField: '_pricingCollectionId',
            foreignField: '_id',
            as: 'pricingCollection',
          },
        },
        { $unwind: '$pricingCollection' },
        {
          $addFields: {
            id: { $toString: '$_id' },
            'pricingCollection.id': { $toString: '$pricingCollection._id' },
            'pricingCollection.ownerId': { $toString: '$pricingCollection._ownerId' },
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            _groupId: 1,
            _pricingCollectionId: 1,
            _organizationId: 1,
            accessRole: 1,
            createdAt: 1,
            pricingCollection: { id: 1, name: 1, description: 1, ownerId: 1 },
          },
        },
      ]);
    } catch (err) {
      return [];
    }
  }

  async findByOrganizationId(organizationId: string, ...args: any) {
    try {
      return await GroupCollectionMongoose.find({
        _organizationId: new mongoose.Types.ObjectId(organizationId),
      }).lean({ virtuals: true });
    } catch (err) {
      return [];
    }
  }

  async findByPricingCollectionId(pricingCollectionId: string, ...args: any) {
    try {
      return await GroupCollectionMongoose.find({
        _pricingCollectionId: new mongoose.Types.ObjectId(pricingCollectionId),
      }).lean({ virtuals: true });
    } catch (err) {
      return [];
    }
  }

  async findByGroupAndCollection(groupId: string, pricingCollectionId: string, ...args: any) {
    try {
      const gc = await GroupCollectionMongoose.findOne({
        _groupId: new mongoose.Types.ObjectId(groupId),
        _pricingCollectionId: new mongoose.Types.ObjectId(pricingCollectionId),
      });
      return gc ? gc.toObject({ getters: true, virtuals: true, versionKey: false }) : null;
    } catch (err) {
      return null;
    }
  }

  async create(data: any, ...args: any) {
    const gc = await new GroupCollectionMongoose(data).save();
    return gc.toObject({ getters: true, virtuals: true, versionKey: false });
  }

  async update(id: string, data: any, ...args: any) {
    return GroupCollectionMongoose.findOneAndUpdate(
      { _id: id },
      data,
      { new: true }
    );
  }

  async updateByGroupAndCollection(groupId: string, pricingCollectionId: string, data: any, ...args: any) {
    return GroupCollectionMongoose.findOneAndUpdate(
      {
        _groupId: new mongoose.Types.ObjectId(groupId),
        _pricingCollectionId: new mongoose.Types.ObjectId(pricingCollectionId),
      },
      data,
      { new: true }
    );
  }

  async destroy(id: string, ...args: any) {
    const result = await GroupCollectionMongoose.deleteOne({ _id: id });
    return result?.deletedCount === 1;
  }

  async destroyByGroupAndCollection(groupId: string, pricingCollectionId: string, ...args: any) {
    const result = await GroupCollectionMongoose.deleteOne({
      _groupId: new mongoose.Types.ObjectId(groupId),
      _pricingCollectionId: new mongoose.Types.ObjectId(pricingCollectionId),
    });
    return result?.deletedCount === 1;
  }

  async destroyByGroupId(groupId: string, ...args: any) {
    const result = await GroupCollectionMongoose.deleteMany({
      _groupId: new mongoose.Types.ObjectId(groupId),
    });
    return result?.deletedCount > 0;
  }

  async destroyByOrganizationId(organizationId: string, ...args: any) {
    const result = await GroupCollectionMongoose.deleteMany({
      _organizationId: new mongoose.Types.ObjectId(organizationId),
    });
    return result?.deletedCount > 0;
  }
}

export default GroupCollectionRepository;
