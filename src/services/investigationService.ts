import mongoose from "mongoose";
import InvestigationModel from "../models/InvestigationModel";
import InvestigationStatusHistoryModel from "../models/InvestigationStatusHistoryModel";
import IncidentModel from "../models/IncidentModel";
import EmployeeModel from "../models/EmployeeModel";
import ProjectRoleModel from "../models/ProjectRoleModel";
import { IUser } from "../models/UserModel";
import { generateInvestigationId } from "../utils/investigationIdGenerator";

export const createInvestigation = async (
  incidentId: string,
  userId: string
) => {
  console.log(`[InvestigationService] Checking for existing investigation for incident: ${incidentId}`);
  
  const existingInvestigation = await InvestigationModel.findOne({ incident: incidentId });
  if (existingInvestigation) {
    console.log(`[InvestigationService] Investigation already exists: ${existingInvestigation._id}`);
    return existingInvestigation;
  }
  
  console.log(`[InvestigationService] No existing investigation found, creating new one`);
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const incident = await IncidentModel.findById(incidentId);
    
    let assignedRole = null;
    let assignedTeam = null;
    
    if (incident?.project) {
      const employee = await EmployeeModel.findOne({ user: new mongoose.Types.ObjectId(userId) });
      
      if (employee) {
        const projectRole = await ProjectRoleModel.findOne({
          employee: employee._id,
          project: incident.project
        }).populate('role', 'title description');
        
        if (projectRole) {
          assignedRole = projectRole.role._id;
          assignedTeam = projectRole.team;
        }
      }
    }
    
    const investigation = await InvestigationModel.create(
      [
        {
          id: generateInvestigationId(),
          incident: incidentId,
          status: "Assigned",
          timerStartedAt: new Date(),
          timerStoppedAt: null,
          timerDuration: null,
          reportUrl: null,
          assignedInvestigator: userId,
          assignedRole: assignedRole,
          assignedTeam: assignedTeam,
          assignedBy: userId,
          assignedAt: new Date(),
        },
      ],
      { session }
    );

    const investigationId = investigation[0]._id;
    console.log(`[InvestigationService] Investigation created: ${investigationId} with ID: ${investigation[0].id}`);

    // Create status history
    await InvestigationStatusHistoryModel.create(
      [
        {
          investigation: investigationId,
          previousStatus: null,
          newStatus: "Assigned",
          changedBy: new mongoose.Types.ObjectId(userId),
          changedAt: new Date(),
          notes: "Investigation started automatically",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    console.log(`[InvestigationService] Investigation creation completed successfully`);
    return investigation[0];
  } catch (error) {
    console.error("[InvestigationService] Error creating investigation:", error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const startInvestigationTimer = async (
  investigationId: string,
  userId: string,
  notes?: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const investigation = await InvestigationModel.findById(investigationId);
    if (!investigation) {
      throw new Error("Investigation not found");
    }

    const previousStatus = investigation.status;

    // Start timer
    investigation.timerStartedAt = new Date();
    investigation.status = "In Progress";
    await investigation.save({ session });

    // Create status history
    await InvestigationStatusHistoryModel.create(
      [
        {
          investigation: investigationId,
          previousStatus,
          newStatus: "In Progress",
          changedBy: new mongoose.Types.ObjectId(userId),
          changedAt: new Date(),
          notes: notes || "Investigation started",
        },
      ],
      { session }
    );

    // Update incident
    await IncidentModel.findByIdAndUpdate(
      investigation.incident,
      { investigationStatus: "In Progress" },
      { session }
    );

    await session.commitTransaction();
    return investigation;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateInvestigationStatus = async (
  investigationId: string,
  newStatus: "Assigned" | "In Progress" | "Delayed" | "Completed",
  userId: string,
  notes?: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const investigation = await InvestigationModel.findById(investigationId);
    if (!investigation) {
      throw new Error("Investigation not found");
    }

    const previousStatus = investigation.status;

    // Handle timer for completion
    if (newStatus === "Completed") {
      if (investigation.timerStartedAt) {
        investigation.timerStoppedAt = new Date();
        investigation.timerDuration = Math.floor(
          (investigation.timerStoppedAt.getTime() -
            investigation.timerStartedAt.getTime()) /
            1000
        );
      }
    }

    investigation.status = newStatus;
    await investigation.save({ session });

    // Create status history
    await InvestigationStatusHistoryModel.create(
      [
        {
          investigation: investigationId,
          previousStatus,
          newStatus,
          changedBy: new mongoose.Types.ObjectId(userId),
          changedAt: new Date(),
          notes: notes || null,
        },
      ],
      { session }
    );

    // Update incident
    await IncidentModel.findByIdAndUpdate(
      investigation.incident,
      { investigationStatus: newStatus },
      { session }
    );

    await session.commitTransaction();
    return investigation;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getInvestigations = async (status?: string) => {
  const query: any = {};
  if (status) {
    query.status = status;
  }

  return InvestigationModel.find(query)
    .populate({
      path: "incident",
      populate: {
        path: "project",
        select: "name",
      },
    })
    .populate("assignedInvestigator", "name email designation")
    .populate("assignedRole", "title description")
    .populate("assignedTeam", "name")
    .sort({ createdAt: -1 });
};

export const getInvestigationById = async (investigationId: string) => {
  return InvestigationModel.findById(investigationId)
    .populate({
      path: "incident",
      populate: {
        path: "project",
        select: "name location",
      },
    })
    .populate("assignedInvestigator", "name email designation")
    .populate("assignedRole", "title description")
    .populate("assignedTeam", "name");
};

export default {
  createInvestigation,
  startInvestigationTimer,
  updateInvestigationStatus,
  getInvestigations,
  getInvestigationById,
};
