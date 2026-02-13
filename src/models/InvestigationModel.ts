import mongoose, { Schema, Document } from "mongoose";

export interface IInvestigation extends Document {
  id: string;
  incident: mongoose.Types.ObjectId;
  status: "Assigned" | "In Progress" | "Delayed" | "Completed";
  timerStartedAt: Date | null;
  timerStoppedAt: Date | null;
  timerDuration: number | null;
  reportUrl: string | null;
  assignedInvestigator: mongoose.Types.ObjectId | null;
  assignedTeam: mongoose.Types.ObjectId | null;
  assignedRole: mongoose.Types.ObjectId | null;
  assignedBy: mongoose.Types.ObjectId | null;
  assignedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const InvestigationSchema: Schema<IInvestigation> = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    incident: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },
    status: {
      type: String,
      enum: ["Assigned", "In Progress", "Delayed", "Completed"],
      default: "Assigned",
    },
    timerStartedAt: {
      type: Date,
      default: null,
    },
    timerStoppedAt: {
      type: Date,
      default: null,
    },
    timerDuration: {
      type: Number,
      default: null,
    },
    reportUrl: {
      type: String,
      default: null,
    },
    assignedInvestigator: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    assignedTeam: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    assignedRole: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

InvestigationSchema.index({ incident: 1 });
InvestigationSchema.index({ status: 1 });

export default mongoose.models.Investigation ||
  mongoose.model<IInvestigation>("Investigation", InvestigationSchema);
