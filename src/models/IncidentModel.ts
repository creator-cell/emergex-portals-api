import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIncident extends Document {
  id: string;
  level: "Level 1" | "Level 2" | "Level 3" | "Level 4";
  type: string;
  description: string;
  status: "Assigned" | "Delayed" | "In Progress" | "Completed" | "Cancelled";
  project: mongoose.Types.ObjectId;
  // assignedTo: mongoose.Types.ObjectId;
  countOfInjuredPeople: number;
  countOfTotalPeople: number;
  location: mongoose.Types.ObjectId;
  damageAssets: string[];
  finance: number;
  utilityAffected: string[];
  image: string[];
  signature: string;
  informToTeam: boolean;
  termsAndConditions: boolean;
  createdBy: mongoose.Types.ObjectId;
  stoppedTime: Date;
  isDeleted?: boolean;
  isStopped?: boolean;
}

const IncidentSchema: Schema = new Schema(
  {
    id: {
      type: String,
      required: [true, "Incident Id is required"],
    },
    level: {
      type: String,
      enum: ["Level 1", "Level 2", "Level 3", "Level 4"],
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Assigned", "Delayed", "In Progress", "Completed", "Cancelled"],
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    // assignedTo: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Employee",
    //   required: true,
    // },
    countOfInjuredPeople: {
      type: Number,
      required: true,
    },
    countOfTotalPeople: {
      type: Number,
      required: true,
    },
    location: {
      type:  mongoose.Schema.Types.ObjectId,
      ref:"Worksite",
      required: true,
    },
    damageAssets: {
      type: [String],
      required: true,
    },
    finance: {
      type: String,
      required: true,
    },
    utilityAffected: {
      type: [String],
      required: true,
    },
    image: {
      type: [String],
    },
    signature: {
      type: String,
    },
    informToTeam: {
      type: Boolean,
      required: true,
    },
    termsAndConditions: {
      type: Boolean,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isStopped: {
      type: Boolean,
      default: false,
    },
    stoppedTime: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const IncidentModel: Model<IIncident> = mongoose.model<IIncident>(
  "Incident",
  IncidentSchema
);
export default IncidentModel;
