import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICountry extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  companyId?: mongoose.Types.ObjectId;
}

const countrySchema = new Schema<ICountry>(
  {
    name: {
      type: String,
      required: [true, 'Country name is required'],
      trim: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
  },
  {
    timestamps: true,
  }
);

countrySchema.index({ name: 1, companyId: 1 }, { unique: true });

const CountryModel: Model<ICountry> = mongoose.model<ICountry>('Country', countrySchema);
export default CountryModel;
