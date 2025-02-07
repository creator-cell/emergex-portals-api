import mongoose, { Document, Schema, Model } from "mongoose";


interface IProject extends Document {
  id:string;
  location: mongoose.Types.ObjectId;
  parentProjectId?: mongoose.Types.ObjectId | null;
  name: string;
  description: string;
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

const ProjectModel: Model<IProject> = mongoose.model<IProject>("Project", ProjectSchema);

export default ProjectModel;
