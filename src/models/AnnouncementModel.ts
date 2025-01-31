import mongoose, { Schema, Document } from 'mongoose';
import { ILocation } from './LocationModel';

export interface IAnnouncement extends Document {
  title: string;
  description: string;
  location: mongoose.Types.ObjectId | ILocation;
  team: mongoose.Types.ObjectId;
  isActive: boolean;
  isDeleted:boolean;
//   createdBy: mongoose.Types.ObjectId;
//   updatedBy: mongoose.Types.ObjectId;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location is required']
    },
    team: {
      type: Schema.Types.ObjectId,
      ref:'Team',
      required: [true, 'Team is required'],
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    // createdBy: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'User',
    //   required: true
    // },
    // updatedBy: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'User',
    //   required: true
    // }
  },
  {
    timestamps: true
  }
);


export default mongoose.model<IAnnouncement>('Announcement', announcementSchema);