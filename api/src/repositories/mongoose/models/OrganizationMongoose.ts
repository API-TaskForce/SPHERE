import mongoose, { Schema } from 'mongoose';

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    description: { type: String, required: false, default: null },
    avatarUrl: { type: String, required: false, default: null },
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

const organizationModel = mongoose.model('Organization', organizationSchema, 'organizations');

export default organizationModel;
