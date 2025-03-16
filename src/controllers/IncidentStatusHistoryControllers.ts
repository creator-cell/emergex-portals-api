import { Request, Response } from "express";
import IncidentStatusHistoryModel from "../models/IncidentStatusHistoryModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import mongoose from "mongoose";
import IncidentHistoryModel from "../models/IncidentHistoryModel";

export const getIncidentStatusHistory = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    let options = getPaginationOptions(req, {
      populate: [
        {
          path: "role",
          model: "User",
          select:"username designation"
        },
      ],
      sort: { createdAt: -1 },
      filter: {
        incident: new mongoose.Types.ObjectId(id),
      },
    });

    const result = await paginate(IncidentStatusHistoryModel, options);

    return res.status(200).json({
      success: true,
      ...result,
      message: "Incident status history retrieved successfully",
    });
  } catch (error) {
    console.log("error: ",error)
    return res.status(500).json({
      success: false,
      error: "Internal server error in retrieving incident status history",
    });
  }
};

export const getIncidentUpdateHistory = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    let options = getPaginationOptions(req, {
      populate: [
        {
          path: "role",
          model: "User",
          select:"username designation"
        },
      ],
      sort: { createdAt: -1 },
      filter: {
        incident: new mongoose.Types.ObjectId(id),
      },
    });

    const result = await paginate(IncidentHistoryModel, options);

    return res.status(200).json({
      success: true,
      ...result,
      message: "Incident history retrieved successfully",
    });
  } catch (error) {
    console.log("error: ",error)
    return res.status(500).json({
      success: false,
      error: "Internal server error in retrieving incident history",
    });
  }
};
