import mongoose, { Document, Model, Schema } from 'mongoose';

interface IRole extends Document {
  name: string;
}

const roleSchema = new Schema<IRole>({
  name: {
    type: String,
    min: [4, "minimum role name length is 4"],
    trim: true,
    required: true,
  }
});

const RoleModel: Model<IRole> = mongoose.model<IRole>('Role', roleSchema);
export default RoleModel;
