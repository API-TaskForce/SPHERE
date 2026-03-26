import mongoose from 'mongoose';
import RepositoryBase from '../RepositoryBase';
import OrganizationMembershipMongoose from './models/OrganizationMembershipMongoose';

class OrganizationMembershipRepository extends RepositoryBase {
  async findById(id: string, ...args: any) {
    try {
      const membership = await OrganizationMembershipMongoose.findById(id);
      return membership
        ? membership.toObject({ getters: true, virtuals: true, versionKey: false })
        : null;
    } catch (err) {
      return null;
    }
  }

  async findByUserId(userId: string, ...args: any) {
    try {
      return await OrganizationMembershipMongoose.aggregate([
        { $match: { _userId: new mongoose.Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'organizations',
            localField: '_organizationId',
            foreignField: '_id',
            as: 'organization',
          },
        },
        { $unwind: '$organization' },
        {
          $addFields: {
            id: { $toString: '$_id' },
            'organization.id': { $toString: '$organization._id' },
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            _userId: 1,
            _organizationId: 1,
            role: 1,
            joinedAt: 1,
            organization: { id: 1, name: 1, displayName: 1, avatarUrl: 1 },
          },
        },
      ]);
    } catch (err) {
      return [];
    }
  }

  async findByOrganizationId(organizationId: string, ...args: any) {
    try {
      return await OrganizationMembershipMongoose.aggregate([
        { $match: { _organizationId: new mongoose.Types.ObjectId(organizationId) } },
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

  async findByUserAndOrganization(userId: string, organizationId: string, ...args: any) {
    try {
      const membership = await OrganizationMembershipMongoose.findOne({
        _userId: new mongoose.Types.ObjectId(userId),
        _organizationId: new mongoose.Types.ObjectId(organizationId),
      });
      return membership
        ? membership.toObject({ getters: true, virtuals: true, versionKey: false })
        : null;
    } catch (err) {
      return null;
    }
  }

  async create(data: any, ...args: any) {
    const membership = await new OrganizationMembershipMongoose(data).save();
    return membership.toObject({ getters: true, virtuals: true, versionKey: false });
  }

  async update(id: string, data: any, ...args: any) {
    return OrganizationMembershipMongoose.findOneAndUpdate(
      { _id: id },
      data,
      { new: true }
    );
  }

  async updateByUserAndOrganization(userId: string, organizationId: string, data: any, ...args: any) {
    return OrganizationMembershipMongoose.findOneAndUpdate(
      {
        _userId: new mongoose.Types.ObjectId(userId),
        _organizationId: new mongoose.Types.ObjectId(organizationId),
      },
      data,
      { new: true }
    );
  }

  async destroy(id: string, ...args: any) {
    const result = await OrganizationMembershipMongoose.deleteOne({ _id: id });
    return result?.deletedCount === 1;
  }

  async destroyByUserAndOrganization(userId: string, organizationId: string, ...args: any) {
    const result = await OrganizationMembershipMongoose.deleteOne({
      _userId: new mongoose.Types.ObjectId(userId),
      _organizationId: new mongoose.Types.ObjectId(organizationId),
    });
    return result?.deletedCount === 1;
  }

  async destroyByOrganizationId(organizationId: string, ...args: any) {
    const result = await OrganizationMembershipMongoose.deleteMany({
      _organizationId: new mongoose.Types.ObjectId(organizationId),
    });
    return result?.deletedCount > 0;
  }
}

export default OrganizationMembershipRepository;
