import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRegion extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  country: mongoose.Types.ObjectId;
  isDeleted?: boolean;
}

const regionSchema = new Schema<IRegion>(
  {
    name: {
      type: String,
      required: [true, 'Region name is required'],
      trim: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
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

const RegionModel: Model<IRegion> = mongoose.model<IRegion>('Region', regionSchema);
export default RegionModel;
