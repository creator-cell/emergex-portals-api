import { Request, Response } from "express";
import investigationService from "../services/investigationService";
import mongoose from "mongoose";
import { ICustomRequest } from "../types/express";
import InvestigationModel from "../models/InvestigationModel";
import InvestigationStatusHistoryModel from "../models/InvestigationStatusHistoryModel";
import UserModel from "../models/UserModel";
import ProjectModel from "../models/ProjectModel";
import IncidentModel from "../models/IncidentModel";
import { GlobalAdminRoles } from "../config/global-enum";

export const getInvestigations = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    // Get user's companyId for filtering
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;
    const isGlobalSuperAdmin = currentUser.role === GlobalAdminRoles.SuperAdmin && !companyId;

    const { status, project } = req.query;

    // Build company filter if not global superadmin
    let companyProjectIds: mongoose.Types.ObjectId[] = [];
    if (!isGlobalSuperAdmin && companyId) {
      const companyProjects = await ProjectModel.find({
        companyId: new mongoose.Types.ObjectId(companyId),
      }).select("_id");
      companyProjectIds = companyProjects.map((p: any) => p._id);

      if (companyProjectIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }
    }

    const investigations = await investigationService.getInvestigations(
      status as string,
      project as string,
      companyProjectIds
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
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    // Get user's companyId for validation
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;
    const isGlobalSuperAdmin = currentUser.role === GlobalAdminRoles.SuperAdmin && !companyId;

    const { id } = req.params;
    const investigation = await investigationService.getInvestigationById(id);

    if (!investigation) {
      return res.status(404).json({
        success: false,
        error: "Investigation not found",
      });
    }

    // If not global superadmin, verify investigation belongs to user's company
    if (!isGlobalSuperAdmin && companyId) {
      // Get the incident's project to check company
      const incident = investigation.incident as any;
      if (incident?.project) {
        const projectId = incident.project._id || incident.project;
        const project = await ProjectModel.findById(projectId);
        
        if (!project || !project.companyId || project.companyId.toString() !== companyId.toString()) {
          return res.status(403).json({
            success: false,
            error: "Access denied: Investigation does not belong to your company",
          });
        }
      } else {
        // If no incident linked, check investigation's project directly
        const projectId = investigation.project;
        if (projectId) {
          const project = await ProjectModel.findById(projectId);
          if (!project || !project.companyId || project.companyId.toString() !== companyId.toString()) {
            return res.status(403).json({
              success: false,
              error: "Access denied: Investigation does not belong to your company",
            });
          }
        }
      }
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
    // Get user's companyId for validation
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;
    const isGlobalSuperAdmin = currentUser.role === GlobalAdminRoles.SuperAdmin && !companyId;

    const { id } = req.params;
    const { notes } = req.body;

    // Validate investigation belongs to user's company
    if (!isGlobalSuperAdmin && companyId) {
      const investigation = await InvestigationModel.findById(id);
      if (!investigation) {
        return res.status(404).json({ success: false, error: "Investigation not found" });
      }

      // Get project through incident
      const incident = investigation.incident;
      if (incident) {
        const incidentData = await IncidentModel.findById(incident);
        if (incidentData?.project) {
          const project = await ProjectModel.findById(incidentData.project);
          if (!project || !project.companyId || project.companyId.toString() !== companyId.toString()) {
            return res.status(403).json({ success: false, error: "Access denied: Investigation does not belong to your company" });
          }
        }
      }
    }

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
    // Get user's companyId for validation
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;
    const isGlobalSuperAdmin = currentUser.role === GlobalAdminRoles.SuperAdmin && !companyId;

    const { id } = req.params;
    const { status, notes } = req.body;

    if (!["Assigned", "In Progress", "Delayed", "Completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    // Validate investigation belongs to user's company
    if (!isGlobalSuperAdmin && companyId) {
      const investigation = await InvestigationModel.findById(id);
      if (!investigation) {
        return res.status(404).json({ success: false, error: "Investigation not found" });
      }

      const incident = investigation.incident;
      if (incident) {
        const incidentData = await IncidentModel.findById(incident);
        if (incidentData?.project) {
          const project = await ProjectModel.findById(incidentData.project);
          if (!project || !project.companyId || project.companyId.toString() !== companyId.toString()) {
            return res.status(403).json({ success: false, error: "Access denied: Investigation does not belong to your company" });
          }
        }
      }
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
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    // Get user's companyId for validation
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;
    const isGlobalSuperAdmin = currentUser.role === GlobalAdminRoles.SuperAdmin && !companyId;

    const { id } = req.params;

    const investigation = await InvestigationModel.findById(id);
    if (!investigation) {
      return res.status(404).json({
        success: false,
        error: "Investigation not found",
      });
    }

    // Validate investigation belongs to user's company
    if (!isGlobalSuperAdmin && companyId) {
      const incident = investigation.incident;
      if (incident) {
        const incidentData = await IncidentModel.findById(incident);
        if (incidentData?.project) {
          const project = await ProjectModel.findById(incidentData.project);
          if (!project || !project.companyId || project.companyId.toString() !== companyId.toString()) {
            return res.status(403).json({ success: false, error: "Access denied: Investigation does not belong to your company" });
          }
        }
      }
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
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    // Get user's companyId for validation
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;
    const isGlobalSuperAdmin = currentUser.role === GlobalAdminRoles.SuperAdmin && !companyId;

    const { id } = req.params;

    // Validate investigation belongs to user's company
    if (!isGlobalSuperAdmin && companyId) {
      const investigation = await InvestigationModel.findById(id);
      if (!investigation) {
        return res.status(404).json({ success: false, error: "Investigation not found" });
      }

      const incident = investigation.incident;
      if (incident) {
        const incidentData = await IncidentModel.findById(incident);
        if (incidentData?.project) {
          const project = await ProjectModel.findById(incidentData.project);
          if (!project || !project.companyId || project.companyId.toString() !== companyId.toString()) {
            return res.status(403).json({ success: false, error: "Access denied: Investigation does not belong to your company" });
          }
        }
      }
    }

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
