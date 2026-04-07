import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorksite extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  region: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const worksiteSchema = new Schema<IWorksite>(
  {
    name: {
      type: String,
      required: [true, 'Worksite name is required'],
      trim: true,
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
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

worksiteSchema.index({ name: 1, region: 1, companyId: 1 }, { unique: true });

const WorksiteModel: Model<IWorksite> = mongoose.model<IWorksite>('Worksite', worksiteSchema);
export default WorksiteModel;
