import { Request, Response } from "express";
import investigationService from "../services/investigationService";
import mongoose from "mongoose";
import { ICustomRequest } from "../types/express";
import InvestigationModel from "../models/InvestigationModel";
import InvestigationStatusHistoryModel from "../models/InvestigationStatusHistoryModel";

export const getInvestigations = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const investigations = await investigationService.getInvestigations(
      status as string
    );

    return res.status(200).json({
      success: true,
      data: investigations,
    });
  } catch (error: any) {
    console.error("Error fetching investigations:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch investigations",
    });
  }
};

export const getInvestigationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const investigation = await investigationService.getInvestigationById(id);

    if (!investigation) {
      return res.status(404).json({
        success: false,
        error: "Investigation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: investigation,
    });
  } catch (error: any) {
    console.error("Error fetching investigation:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch investigation",
    });
  }
};

export const startInvestigationTimer = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    const { id } = req.params;
    const { notes } = req.body;

    const investigation = await investigationService.startInvestigationTimer(
      id,
      currentUser.id,
      notes
    );

    return res.status(200).json({
      success: true,
      message: "Investigation timer started",
      data: investigation,
    });
  } catch (error: any) {
    console.error("Error starting investigation timer:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to start investigation timer",
    });
  }
};

export const updateInvestigationStatus = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!["Assigned", "In Progress", "Delayed", "Completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const investigation = await investigationService.updateInvestigationStatus(
      id,
      status,
      currentUser.id,
      notes
    );

    return res.status(200).json({
      success: true,
      message: "Investigation status updated",
      data: investigation,
    });
  } catch (error: any) {
    console.error("Error updating investigation status:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update investigation status",
    });
  }
};

export const stopInvestigationTimer = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const investigation = await InvestigationModel.findById(id);
    if (!investigation) {
      return res.status(404).json({
        success: false,
        error: "Investigation not found",
      });
    }

    if (investigation.timerStoppedAt) {
      return res.status(400).json({
        success: false,
        error: "Investigation timer already stopped",
      });
    }

    if (!investigation.timerStartedAt) {
      return res.status(400).json({
        success: false,
        error: "Investigation timer not started",
      });
    }

    investigation.timerStoppedAt = new Date();
    investigation.timerDuration = Math.floor(
      (investigation.timerStoppedAt.getTime() - investigation.timerStartedAt.getTime()) / 1000
    );
    await investigation.save();

    return res.status(200).json({
      success: true,
      message: "Investigation timer stopped successfully",
      data: investigation,
    });
  } catch (error: any) {
    console.error("Error stopping investigation timer:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to stop investigation timer",
    });
  }
};

export const getInvestigationHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const history = await InvestigationStatusHistoryModel.aggregate([
      {
        $match: {
          investigation: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "investigations",
          localField: "investigation",
          foreignField: "_id",
          as: "investigationData",
        },
      },
      {
        $unwind: "$investigationData",
      },
      {
        $lookup: {
          from: "users",
          localField: "changedBy",
          foreignField: "_id",
          as: "changedByUser",
        },
      },
      {
        $unwind: {
          path: "$changedByUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "changedByUser._id",
          foreignField: "user",
          as: "changedByEmployee",
        },
      },
      {
        $unwind: {
          path: "$changedByEmployee",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "teams",
          localField: "investigationData.assignedTeam",
          foreignField: "_id",
          as: "assignedTeamData",
        },
      },
      {
        $unwind: {
          path: "$assignedTeamData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "investigationData.assignedRole",
          foreignField: "_id",
          as: "assignedRoleData",
        },
      },
      {
        $unwind: {
          path: "$assignedRoleData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            $ifNull: ["$assignedTeamData.name", "Unassigned"],
          },
          data: {
            $push: {
              role: {
                employee: {
                  name: {
                    $ifNull: ["$changedByEmployee.name", { $ifNull: ["$changedByUser.firstName", "Unknown"] }],
                  },
                  designation: {
                    $ifNull: ["$changedByEmployee.designation", "Unknown"],
                  },
                },
                role: {
                  title: {
                    $ifNull: ["$assignedRoleData.title", "Investigation Role"],
                  },
                },
              },
              status: "$newStatus",
              createdAt: "$changedAt",
              notes: "$notes",
              previousStatus: "$previousStatus",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          team: "$_id",
          data: 1,
        },
      },
      {
        $sort: {
          team: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error("Error fetching investigation history:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch investigation history",
    });
  }
};
