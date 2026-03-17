import mongoose from 'mongoose';
import RepositoryBase from '../RepositoryBase';
import GroupMembershipMongoose from './models/GroupMembershipMongoose';

class GroupMembershipRepository extends RepositoryBase {
  async findById(id: string, ...args: any) {
    try {
      const membership = await GroupMembershipMongoose.findById(id);
      return membership
        ? membership.toObject({ getters: true, virtuals: true, versionKey: false })
        : null;
    } catch (err) {
      return null;
    }
  }

  async findByUserId(userId: string, ...args: any) {
    try {
      return await GroupMembershipMongoose.aggregate([
        { $match: { _userId: new mongoose.Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'groups',
            localField: '_groupId',
            foreignField: '_id',
            as: 'group',
          },
        },
        { $unwind: '$group' },
        {
          $addFields: {
            id: { $toString: '$_id' },
            'group.id': { $toString: '$group._id' },
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            _userId: 1,
            _groupId: 1,
            _organizationId: 1,
            role: 1,
            joinedAt: 1,
            group: { id: 1, name: 1, displayName: 1 },
          },
        },
      ]);
    } catch (err) {
      return [];
    }
  }

  async findByGroupId(groupId: string, ...args: any) {
    try {
      return await GroupMembershipMongoose.aggregate([
        { $match: { _groupId: new mongoose.Types.ObjectId(groupId) } },
        {
          $lookup: {
            from: 'users',
            localField: '_userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $addFields: {
            id: { $toString: '$_id' },
            'user.id': { $toString: '$user._id' },
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            _userId: 1,
            _groupId: 1,
            _organizationId: 1,
            role: 1,
            joinedAt: 1,
            user: { id: 1, username: 1, email: 1, avatar: 1 },
          },
        },
      ]);
    } catch (err) {
      return [];
    }
  }

  async findByOrganizationId(organizationId: string, ...args: any) {
    try {
      return await GroupMembershipMongoose.find({
        _organizationId: new mongoose.Types.ObjectId(organizationId),
      }).lean({ virtuals: true });
    } catch (err) {
      return [];
    }
  }

  async findByUserAndGroup(userId: string, groupId: string, ...args: any) {
    try {
      const membership = await GroupMembershipMongoose.findOne({
        _userId: new mongoose.Types.ObjectId(userId),
        _groupId: new mongoose.Types.ObjectId(groupId),
      });
      return membership
        ? membership.toObject({ getters: true, virtuals: true, versionKey: false })
        : null;
    } catch (err) {
      return null;
    }
  }

  async create(data: any, ...args: any) {
    const membership = await new GroupMembershipMongoose(data).save();
    return membership.toObject({ getters: true, virtuals: true, versionKey: false });
  }

  async update(id: string, data: any, ...args: any) {
    return GroupMembershipMongoose.findOneAndUpdate(
      { _id: id },
      data,
      { new: true }
    );
  }

  async updateByUserAndGroup(userId: string, groupId: string, data: any, ...args: any) {
    return GroupMembershipMongoose.findOneAndUpdate(
      {
        _userId: new mongoose.Types.ObjectId(userId),
        _groupId: new mongoose.Types.ObjectId(groupId),
      },
      data,
      { new: true }
    );
  }

  async destroy(id: string, ...args: any) {
    const result = await GroupMembershipMongoose.deleteOne({ _id: id });
    return result?.deletedCount === 1;
  }

  async destroyByUserAndGroup(userId: string, groupId: string, ...args: any) {
    const result = await GroupMembershipMongoose.deleteOne({
      _userId: new mongoose.Types.ObjectId(userId),
      _groupId: new mongoose.Types.ObjectId(groupId),
    });
    return result?.deletedCount === 1;
  }

  async destroyByGroupId(groupId: string, ...args: any) {
    const result = await GroupMembershipMongoose.deleteMany({
      _groupId: new mongoose.Types.ObjectId(groupId),
    });
    return result?.deletedCount > 0;
  }

  async destroyByOrganizationId(organizationId: string, ...args: any) {
    const result = await GroupMembershipMongoose.deleteMany({
      _organizationId: new mongoose.Types.ObjectId(organizationId),
    });
    return result?.deletedCount > 0;
  }
}

export default GroupMembershipRepository;
