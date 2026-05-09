import mongoose, { Schema } from 'mongoose';

const groupCollectionSchema = new Schema(
  {
    _groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    _pricingCollectionId: { type: Schema.Types.ObjectId, ref: 'PricingCollection', required: true },
    _organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    accessRole: { type: String, required: false, default: null, enum: ['editor', 'viewer', null] },
    createdAt: { type: Date, required: true, default: Date.now },
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

groupCollectionSchema.virtual('group', {
  ref: 'Group',
  localField: '_groupId',
  foreignField: '_id',
  justOne: true,
});

groupCollectionSchema.virtual('pricingCollection', {
  ref: 'PricingCollection',
  localField: '_pricingCollectionId',
  foreignField: '_id',
  justOne: true,
});

groupCollectionSchema.virtual('organization', {
  ref: 'Organization',
  localField: '_organizationId',
  foreignField: '_id',
  justOne: true,
});

// A group can only have one access entry per pricing collection
groupCollectionSchema.index({ _groupId: 1, _pricingCollectionId: 1 }, { unique: true });

// Index for querying all group collections within an organization
groupCollectionSchema.index({ _organizationId: 1 });

const groupCollectionModel = mongoose.model('GroupCollection', groupCollectionSchema, 'groupCollections');

export default groupCollectionModel;
