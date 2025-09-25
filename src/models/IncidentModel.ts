import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIncident extends Document {
  id: string;
  level: "Level 1" | "Level 2" | "Level 3" | "Level 4";
  type: string;
  description: string;
  status: "Assigned" | "Delayed" | "In Progress" | "Completed" | "Cancelled";
  project: mongoose.Types.ObjectId;
  countOfInjuredPeople: number;
  countOfTotalPeople: number;
  location: string;
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
  isApproved: boolean;
  approvedAt: Date;
}

const IncidentSchema: Schema = new Schema(
  {
    id: {
      type: String,
      required: [true, "Incident Id is required"],
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Not-Approved", "Assigned", "Delayed", "In Progress", "Completed", "Cancelled"],
      required: true,
      default: 'Not-Approved'
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    countOfInjuredPeople: {
      type: Number,
      required: true,
    },
    countOfTotalPeople: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
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
    isApproved: {
      type: Boolean,
      default: false,
      required: true
    },
    isNearMiss: {
      type: Boolean,
      default: false
    },
    approvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

const IncidentModel: Model<IIncident> = mongoose.model<IIncident>(
  "Incident",
  IncidentSchema
);
export default IncidentModel;
