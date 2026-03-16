import mongoose, { Model, Schema } from "mongoose";

export interface IInvestigationChart extends Document{
  role: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  description: string;
  priority:number;
  project:mongoose.Types.ObjectId;
  from:mongoose.Types.ObjectId;
  to:mongoose.Types.ObjectId;
}

export const InvestigationChartSchema = new Schema<IInvestigationChart>(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    description: {
      type: String,
    },
    priority:{
      type:Number
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  {
    timestamps: true,
  }
);

const InvestigationChartModel:Model<IInvestigationChart>=mongoose.model<IInvestigationChart>("Investigation_Chart",InvestigationChartSchema);
export default InvestigationChartModel;
