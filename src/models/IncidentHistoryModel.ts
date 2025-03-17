import mongoose, { Schema, Document } from "mongoose";

interface IIncidentHistory extends Document {
  title: string;
  role: mongoose.Types.ObjectId;
  incident: mongoose.Types.ObjectId;
}

const IncidentHistorySchema = new Schema<IIncidentHistory>(
  {
    title: { type: String, required: true },
    role: { type: Schema.Types.ObjectId, ref: "Roles", required: true },
    incident: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
  },
  { timestamps: true }
);

const IncidentHistoryModel = mongoose.model<IIncidentHistory>(
  "incident_history",
  IncidentHistorySchema
);

export default IncidentHistoryModel;
