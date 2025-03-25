import { Schema, model, Document } from 'mongoose';

export interface IRole extends Document {
  _id:Schema.Types.ObjectId;
  title: string;
  description: string;
  isTrash?:boolean;
  createdBy: Schema.Types.ObjectId;
}

const RoleSchema = new Schema<IRole>(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
    isTrash:{type:Boolean,default:false}
  },
  { timestamps: true }
);

export default model<IRole>('Role', RoleSchema);