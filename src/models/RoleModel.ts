import mongoose, { Model, Schema } from "mongoose";

export interface IRoles extends Document{
  team: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  description: string;
  priority:number;
  project:mongoose.Types.ObjectId;
  from:mongoose.Types.ObjectId;
  to:mongoose.Types.ObjectId;
}

export const RoleSchema = new Schema<IRoles>(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
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

const RoleModel:Model<IRoles>=mongoose.model<IRoles>("Roles",RoleSchema);
export default RoleModel;

