import mongoose, { Schema } from 'mongoose';

const organizationMembershipSchema = new Schema(
  {
    _userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    _organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    role: { type: String, required: true, enum: ['owner', 'admin', 'member'] },
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

organizationMembershipSchema.virtual('user', {
  ref: 'User',
  localField: '_userId',
  foreignField: '_id',
  justOne: true,
});

organizationMembershipSchema.virtual('organization', {
  ref: 'Organization',
  localField: '_organizationId',
  foreignField: '_id',
  justOne: true,
});

// A user can only have one membership per organization
organizationMembershipSchema.index({ _userId: 1, _organizationId: 1 }, { unique: true });

const organizationMembershipModel = mongoose.model(
  'OrganizationMembership',
  organizationMembershipSchema,
  'organizationMemberships'
);

export default organizationMembershipModel;
