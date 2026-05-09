import mongoose, { Schema } from 'mongoose';

const datasheetCollectionSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
    _ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    private: { type: Boolean, required: true, default: false },
    analytics: { type: Schema.Types.Mixed, required: false },
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (doc, resultObject, options) {
        delete resultObject._id;
        delete resultObject.__v;
        delete resultObject._ownerId;
        return resultObject;
      },
    },
  }
);

datasheetCollectionSchema.virtual('owner', {
  ref: 'User',
  localField: '_ownerId',
  foreignField: '_id',
  justOne: true,
});

// Adding unique index for [name, owner]
datasheetCollectionSchema.index({ name: 1, _ownerId: 1 }, { unique: true });

const datasheetCollectionModel = mongoose.model(
  'DatasheetCollection',
  datasheetCollectionSchema,
  'datasheetCollections'
);

export default datasheetCollectionModel;
