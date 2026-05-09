import mongoose, { Schema } from 'mongoose';

const groupMembershipSchema = new Schema(
  {
    _userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    _groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    _organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    role: { type: String, required: true, enum: ['admin', 'editor', 'viewer'] },
    joinedAt: { type: Date, required: true, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (doc, resultObject, options) {
        delete resultObject._id;
        delete resultObject.__v;
        return resultObject;
      },
    },
  }
);

groupMembershipSchema.virtual('user', {
  ref: 'User',
  localField: '_userId',
  foreignField: '_id',
  justOne: true,
});

groupMembershipSchema.virtual('group', {
  ref: 'Group',
  localField: '_groupId',
  foreignField: '_id',
  justOne: true,
});

groupMembershipSchema.virtual('organization', {
  ref: 'Organization',
  localField: '_organizationId',
  foreignField: '_id',
  justOne: true,
});

// A user can only have one membership per group
groupMembershipSchema.index({ _userId: 1, _groupId: 1 }, { unique: true });

// Index for querying all memberships within an organization
groupMembershipSchema.index({ _organizationId: 1 });

const groupMembershipModel = mongoose.model('GroupMembership', groupMembershipSchema, 'groupMemberships');

export default groupMembershipModel;
