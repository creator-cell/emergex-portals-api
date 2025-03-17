import mongoose, { Document, Schema, Model } from "mongoose";
import { z } from "zod";

export interface IEmployee extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  contactNo: string;
  designation: string;
  email: string;
  createdBy: mongoose.Types.ObjectId;
  isDeleted:boolean;
}

export const EmployeeSchema = new Schema<IEmployee>(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    contactNo: {
      type: String,
      required: [true, "Contact number is required."],
      validate: {
        validator: (value: string) => /^\d{10}$/.test(value),
        message: "Contact number must be 10 digits.",
      },
    },
    designation: {
      type: String,
      required: [true, "Designation is required."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      validate: {
        validator: (value: string) => z.string().email().safeParse(value).success,
        message: "Invalid email format.",
      },
    },
    isDeleted:{
      type:Boolean,
      default:false
    },
    createdBy:{
      type:Schema.Types.ObjectId,
      ref:'User'
    },
  },
  {
    timestamps: true,
  }
);

const EmployeeModel: Model<IEmployee> = mongoose.model<IEmployee>("Employee", EmployeeSchema);
export default EmployeeModel;
