import mongoose, { Model, Schema } from "mongoose";

export interface IEmergexChart extends Document{
  role: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  description: string;
  priority:number;
  project:mongoose.Types.ObjectId;
  from:mongoose.Types.ObjectId;
  to:mongoose.Types.ObjectId;
}

export const EmergexChartSchema = new Schema<IEmergexChart>(
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

const EmergexChartModel:Model<IEmergexChart>=mongoose.model<IEmergexChart>("Emergex_Chart",EmergexChartSchema);
export default EmergexChartModel;
