import mongoose, { Schema, Document } from "mongoose";

interface IIncidentHistory extends Document {
  incident: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  title: string;
//   role: mongoose.Types.ObjectId;
  date: string;
  time: string;
}

const IncidentHistorySchema = new Schema<IIncidentHistory>(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    title: { type: String, required: true },
    // role: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Role",
    //   required: true,
    // },
    date: { type: String, required: true },
    time: { type: String, required: true },
  },
  { timestamps: true }
);

const IncidentHistory = mongoose.model<IIncidentHistory>(
  "IncidentHistory",
  IncidentHistorySchema
);

export default IncidentHistory;
