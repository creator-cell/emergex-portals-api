import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRegion extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  country: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
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

regionSchema.index({ name: 1, country: 1, companyId: 1 }, { unique: true });

const RegionModel: Model<IRegion> = mongoose.model<IRegion>('Region', regionSchema);
export default RegionModel;
