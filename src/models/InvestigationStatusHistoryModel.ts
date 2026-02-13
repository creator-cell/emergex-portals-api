import mongoose, { Schema, Document } from "mongoose";

export interface IInvestigationStatusHistory extends Document {
  investigation: mongoose.Types.ObjectId;
  previousStatus: string | null;
  newStatus: string;
  changedBy: mongoose.Types.ObjectId;
  changedAt: Date;
  notes: string | null;
}

const InvestigationStatusHistorySchema: Schema<IInvestigationStatusHistory> =
  new Schema(
    {
      investigation: {
        type: Schema.Types.ObjectId,
        ref: "Investigation",
        required: true,
      },
      previousStatus: {
        type: String,
        default: null,
      },
      newStatus: {
        type: String,
        required: true,
      },
      changedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
      notes: {
        type: String,
        default: null,
      },
    },
    {
      timestamps: false,
    }
  );

InvestigationStatusHistorySchema.index({ investigation: 1 });
InvestigationStatusHistorySchema.index({ changedAt: -1 });

export default mongoose.models.InvestigationStatusHistory ||
  mongoose.model<IInvestigationStatusHistory>(
    "InvestigationStatusHistory",
    InvestigationStatusHistorySchema
  );
