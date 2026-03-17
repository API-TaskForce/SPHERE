import mongoose, { Schema } from 'mongoose';

const groupSchema = new Schema(
  {
    name: { type: String, required: true },
    displayName: { type: String, required: false, default: null },
    description: { type: String, required: false, default: null },
    _organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    _parentGroupId: { type: Schema.Types.ObjectId, ref: 'Group', required: false, default: null },
  },
  {
    timestamps: true,
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

groupSchema.virtual('organization', {
  ref: 'Organization',
  localField: '_organizationId',
  foreignField: '_id',
  justOne: true,
});

groupSchema.virtual('parentGroup', {
  ref: 'Group',
  localField: '_parentGroupId',
  foreignField: '_id',
  justOne: true,
});

// Group name must be unique within an organization
groupSchema.index({ name: 1, _organizationId: 1 }, { unique: true });

const groupModel = mongoose.model('Group', groupSchema, 'groups');

export default groupModel;
