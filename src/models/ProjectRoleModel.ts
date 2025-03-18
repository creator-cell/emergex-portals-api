import mongoose, { Model, Schema } from "mongoose";

export interface IProjectRoles extends Document{
  role: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  description: string;
  priority:number;
  project:mongoose.Types.ObjectId;
  from:mongoose.Types.ObjectId;
  to:mongoose.Types.ObjectId;
}

export const ProjectRoleSchema = new Schema<IProjectRoles>(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roles",
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

const ProjectRoleModel:Model<IProjectRoles>=mongoose.model<IProjectRoles>("Project_Roles",ProjectRoleSchema);
export default ProjectRoleModel;

