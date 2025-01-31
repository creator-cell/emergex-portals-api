import mongoose, { Document, Schema, Model } from "mongoose";

export interface IProjectRoles extends Document{
  team: mongoose.Types.ObjectId;
  assignTo: mongoose.Types.ObjectId;
  roleDescription: string;
}

export const ProjectRoleSchema = new Schema<IProjectRoles>(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      // required: [true, "Team Role is required."]
    },
    assignTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      // required: [true, "Employee to assign role is required."]
    },
    roleDescription: {
      type: String,
      // required: [true, "Role description is required."]
    }
  },
  {
    timestamps: true,
  }
);

interface IProject extends Document {
  id:string;
  location: mongoose.Types.ObjectId;
  parentProjectId?: mongoose.Types.ObjectId | null;
  name: string;
  description: string;
  roles: IProjectRoles[];
  createdBy:mongoose.Types.ObjectId;
  isDeleted?:boolean;
}

export const ProjectSchema = new Schema<IProject>(
  {
    id: {
      type: String,
      required: [true, "Project ID is required."],
      unique: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId || null,
      ref: 'Location',
    },
    parentProjectId: {
      type: mongoose.Schema.Types.ObjectId || null,
      ref: 'Project',
    },
    name: {
      type: String,
      // required: [true, "Project name is required."],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Project description is required."],
      trim: true,
    },
    roles: {
      type: [ProjectRoleSchema],
      // required: [true, "At least one role is required."],
    },
    createdBy:{
      type:Schema.Types.ObjectId,
      ref:"User"
    },
    isDeleted:{
      type:Boolean,
      default:false
    }
  },
  {
    timestamps: true,
  }
);

// const ProjectRolesModel:Model<IProjectRoles>=mongoose.model<IProjectRoles>("Roles",ProjectRoleSchema)

const ProjectModel: Model<IProject> = mongoose.model<IProject>("Project", ProjectSchema);

export default ProjectModel;
