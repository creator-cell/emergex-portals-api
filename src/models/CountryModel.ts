import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICountry extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
}

const countrySchema = new Schema<ICountry>(
  {
    name: {
      type: String,
      required: [true, 'Country name is required'],
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const CountryModel: Model<ICountry> = mongoose.model<ICountry>('Country', countrySchema);
export default CountryModel;
