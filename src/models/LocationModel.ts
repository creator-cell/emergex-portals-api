import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILocation extends Document {
  _id:mongoose.Types.ObjectId;
  country: mongoose.Types.ObjectId;
  region: mongoose.Types.ObjectId;
  worksite: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const locationSchema = new Schema<ILocation>(
  {
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      required: true,
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: true,
    },
    worksite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worksite',
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.index({ country: 1, region: 1, worksite: 1, companyId: 1 }, { unique: true });

const LocationModel: Model<ILocation> = mongoose.model<ILocation>('Location', locationSchema);
export default LocationModel;
