import mongoose, { Schema, Document } from "mongoose";

interface IIncidentReport extends Document {
    url: string;
    projectId: mongoose.Types.ObjectId;
    incidentId: mongoose.Types.ObjectId;
}

const IncidentReportSchema = new Schema<IIncidentReport>(
    {
        url: { type: String, required: true },
        incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
        projectId: { type: Schema.Types.ObjectId, ref: "Projects", required: true },
    },
    { timestamps: true }
);

const IncidentReportModel = mongoose.model<IIncidentReport>(
    "incident_reports",
    IncidentReportSchema
);

export { IncidentReportSchema, IncidentReportModel };
