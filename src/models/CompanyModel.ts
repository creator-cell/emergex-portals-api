import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICompany extends Document {
  name: string;
  logo?: string;
  location?: string;
  businessType?: string;
  emergencyContactNumber?: string;
  email: string;
  contactNumber?: string;
  isActive?: boolean;
  createdBy?: mongoose.Types.ObjectId;
}

const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    businessType: {
      type: String,
      default: "",
    },
    emergencyContactNumber: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const CompanyModel: Model<ICompany> = mongoose.model<ICompany>("Company", companySchema);

export default CompanyModel;
