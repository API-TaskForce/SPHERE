import mongoose, { Schema } from 'mongoose';

const datasheetSchema = new Schema(
  {
    name: { type: String, required: true },
    owner: { type: String, required: true },
    _collectionId: { type: Schema.Types.ObjectId, ref: 'DatasheetCollection', required: false },
    version: { type: String, required: true },
    extractionDate: { type: Date, required: true },
    url: { type: String, required: false },
    yaml: { type: String, required: true },
    private: { type: Boolean, required: true, default: false },
    analytics: { type: Schema.Types.Mixed, required: false },
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

datasheetSchema.virtual('collection', {
  ref: 'DatasheetCollection',
  localField: '_collectionId',
  foreignField: '_id',
  justOne: true,
});

// Adding unique index for [name, owner, version]
datasheetSchema.index({ name: 1, owner: 1, version: 1, _collectionId: 1 }, { unique: true });

const datasheetModel = mongoose.model('Datasheet', datasheetSchema, 'datasheets');

export default datasheetModel;
