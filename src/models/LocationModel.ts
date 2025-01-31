import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILocation extends Document {
  _id:mongoose.Types.ObjectId;
  country: mongoose.Types.ObjectId;
  region: mongoose.Types.ObjectId;
  worksite: mongoose.Types.ObjectId;
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const LocationModel: Model<ILocation> = mongoose.model<ILocation>('Location', locationSchema);
export default LocationModel;
