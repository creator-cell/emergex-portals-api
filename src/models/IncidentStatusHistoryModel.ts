import mongoose, { Schema, Document } from "mongoose";

interface IIncidentStatusHistory extends Document {
  status: string;
  old: string;
  role: mongoose.Types.ObjectId;
  incident: mongoose.Types.ObjectId;
}

const IncidentStatusHistorySchema = new Schema<IIncidentStatusHistory>(
  {
    status: { type: String, required: true },
    old: { type: String, required: true },
    role: { type: Schema.Types.ObjectId, ref: "Roles", required: true },
    incident: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
  },
  { timestamps: true }
);

const IncidentStatusHistoryModel = mongoose.model<IIncidentStatusHistory>(
  "incident_status_history",
  IncidentStatusHistorySchema
);

export default IncidentStatusHistoryModel;
