import { Request, Response } from "express";
import WitnessStatementModel from "../models/WitnessStatementModel";
import mongoose from "mongoose";
import { UploadFile, DeleteFile } from "../helper/S3Bucket";

export const addWitnessStatement = async (req: Request, res: Response) => {
  try {
    const { investigation, description } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!investigation || !description) {
      return res.status(400).json({
        success: false,
        error: "Investigation ID and description are required",
      });
    }

    // Process uploaded files
    const documents: {
      filename: string;
      url: string;
      mimeType: string;
      uploadedAt: Date;
    }[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const fileName = `witness_${investigation}_${Date.now()}_${file.originalname}`;
        
        // Use UploadFile directly with buffer - supports all file types
        const uploadResponse = await UploadFile({
          file: file.buffer,
          fileName: fileName,
          contentType: file.mimetype
        });

        if (uploadResponse.Success) {
          documents.push({
            filename: file.originalname,
            url: uploadResponse.ImageURl || "",
            mimeType: file.mimetype,
            uploadedAt: new Date(),
          });
        } else {
          console.error("Upload failed for file:", file.originalname, uploadResponse.Error);
        }
      }
    }

    console.log("Creating witness statement with documents:", documents);

    const witnessStatement = await WitnessStatementModel.create({
      investigation: new mongoose.Types.ObjectId(investigation),
      description,
      documents,
    });

    return res.status(201).json({
      success: true,
      message: "Witness statement added successfully",
      data: witnessStatement,
    });
  } catch (error: any) {
    console.error("Error adding witness statement:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to add witness statement",
    });
  }
};

export const getWitnessStatementsByInvestigation = async (
  req: Request,
  res: Response
) => {
  try {
    const { investigationId } = req.params;

    const witnessStatements = await WitnessStatementModel.find({
      investigation: investigationId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: witnessStatements,
    });
  } catch (error: any) {
    console.error("Error fetching witness statements:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch witness statements",
    });
  }
};

export const getWitnessStatementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const witnessStatement = await WitnessStatementModel.findById(id);

    if (!witnessStatement) {
      return res.status(404).json({
        success: false,
        error: "Witness statement not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: witnessStatement,
    });
  } catch (error: any) {
    console.error("Error fetching witness statement:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch witness statement",
    });
  }
};

export const updateWitnessStatement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const files = req.files as Express.Multer.File[];

    const existingStatement = await WitnessStatementModel.findById(id);
    if (!existingStatement) {
      return res.status(404).json({
        success: false,
        error: "Witness statement not found",
      });
    }

    // Process new uploaded files
    let documents = existingStatement.documents || [];

    if (files && files.length > 0) {
      for (const file of files) {
        const fileName = `witness_${existingStatement.investigation}_${Date.now()}_${file.originalname}`;
        
        // Use UploadFile directly with buffer - supports all file types
        const uploadResponse = await UploadFile({
          file: file.buffer,
          fileName: fileName,
          contentType: file.mimetype
        });

        if (uploadResponse.Success) {
          documents.push({
            filename: file.originalname,
            url: uploadResponse.ImageURl || "",
            mimeType: file.mimetype,
            uploadedAt: new Date(),
          });
        } else {
          console.error("Upload failed for file:", file.originalname, uploadResponse.Error);
        }
      }
    }

    console.log("Updating witness statement with documents:", documents);

    const witnessStatement = await WitnessStatementModel.findByIdAndUpdate(
      id,
      {
        description: description || existingStatement.description,
        documents,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Witness statement updated successfully",
      data: witnessStatement,
    });
  } catch (error: any) {
    console.error("Error updating witness statement:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update witness statement",
    });
  }
};

export const deleteWitnessStatement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const witnessStatement = await WitnessStatementModel.findByIdAndDelete(id);

    if (!witnessStatement) {
      return res.status(404).json({
        success: false,
        error: "Witness statement not found",
      });
    }

    // Delete all associated files from S3
    if (witnessStatement.documents && witnessStatement.documents.length > 0) {
      for (const doc of witnessStatement.documents) {
        try {
          // Extract S3 key from URL
          const urlParts = doc.url.split(".amazonaws.com/");
          if (urlParts.length > 1) {
            const s3Key = urlParts[1];
            await DeleteFile(s3Key);
          }
        } catch (deleteError) {
          console.error("Error deleting file from S3:", deleteError);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Witness statement deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting witness statement:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to delete witness statement",
    });
  }
};

export const deleteWitnessStatementFile = async (req: Request, res: Response) => {
  try {
    const { id, fileIndex } = req.params;
    const index = parseInt(fileIndex, 10);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid file index",
      });
    }

    const witnessStatement = await WitnessStatementModel.findById(id);

    if (!witnessStatement) {
      return res.status(404).json({
        success: false,
        error: "Witness statement not found",
      });
    }

    if (!witnessStatement.documents || witnessStatement.documents.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No files found in witness statement",
      });
    }

    if (index >= witnessStatement.documents.length) {
      return res.status(404).json({
        success: false,
        error: "File index out of bounds",
      });
    }

    // Get the file to be deleted
    const fileToDelete = witnessStatement.documents[index];

    // Delete file from S3
    try {
      const urlParts = fileToDelete.url.split(".amazonaws.com/");
      if (urlParts.length > 1) {
        const s3Key = urlParts[1];
        await DeleteFile(s3Key);
        console.log("File deleted from S3:", s3Key);
      }
    } catch (deleteError) {
      console.error("Error deleting file from S3:", deleteError);
      // Continue even if S3 deletion fails
    }

    // Remove file from documents array
    witnessStatement.documents.splice(index, 1);

    // Save the updated witness statement
    await witnessStatement.save();

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
      data: witnessStatement,
    });
  } catch (error: any) {
    console.error("Error deleting witness statement file:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to delete witness statement file",
    });
  }
};
