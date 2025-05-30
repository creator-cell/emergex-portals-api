import mongoose, { Schema, Document } from "mongoose";

interface IIncidentStatusHistory extends Document {
  status: string;
  old: string | null;
  role: mongoose.Types.ObjectId;
  incident: mongoose.Types.ObjectId;
}

const IncidentStatusHistorySchema = new Schema<IIncidentStatusHistory>(
  {
    status: { type: String, required: true },
    old: { type: String || null,default: null },
    role: { type: Schema.Types.ObjectId, ref: "Project_Roles", required: true },
    incident: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
  },
  { timestamps: true }
);  

const IncidentStatusHistoryModel = mongoose.model<IIncidentStatusHistory>(
  "incident_status_history",
  IncidentStatusHistorySchema
);

export default IncidentStatusHistoryModel;
