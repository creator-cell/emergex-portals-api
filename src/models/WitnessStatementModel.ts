import mongoose, { Schema, Document } from "mongoose";

export interface IDocument {
  filename: string;
  url: string;
  mimeType: string;
  uploadedAt: Date;
}

export interface IWitnessStatement extends Document {
  investigation: mongoose.Types.ObjectId;
  description: string;
  documents: IDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema<IDocument> = new Schema({
  filename: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const WitnessStatementSchema: Schema<IWitnessStatement> = new Schema(
  {
    investigation: {
      type: Schema.Types.ObjectId,
      ref: "Investigation",
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    documents: {
      type: [DocumentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

WitnessStatementSchema.index({ investigation: 1 });

export default mongoose.models.WitnessStatement ||
  mongoose.model<IWitnessStatement>("WitnessStatement", WitnessStatementSchema);
