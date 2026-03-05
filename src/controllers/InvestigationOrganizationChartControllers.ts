import { Request, Response } from "express";
import InvestigationOrganizationChartModel from "../models/InvestigationOrganizationChartModel";
import ProjectModel from "../models/ProjectModel";
import TeamModel from "../models/TeamModel";
import EmployeeModel from "../models/EmployeeModel";
import RoleModel from "../models/RoleModel";
import mongoose from "mongoose";
import { InvestigationRoles } from "../config/global-enum";

export const getInvestigationOrgChart = async (req: Request, res: Response) => {
    const { id } = req.params;

    console.log("=== GET INVESTIGATION ORG CHART ===");
    console.log("projectId:", id);
    console.log("===================================");

    try {
        // Validate projectId
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(200).json({
                success: false,
                error: "Invalid project ID",
            });
        }

        const projectId = new mongoose.Types.ObjectId(id);
        const isProjectExist = await ProjectModel.findById(projectId);

        if (!isProjectExist) {
            return res.status(200).json({
                success: false,
                error: `${req.i18n.t("projectValidationMessages.response.notExist")} ${id}`,
            });
        }

        const investigationRole = await RoleModel.findOne({
            title: InvestigationRoles.INVESTIGATION_SPECIALIST,
        });

        console.log("Found investigation role:", investigationRole);

        if (!investigationRole) {
            return res.status(200).json({
                success: true,
                message: "Investigation Specialist role not found",
                data: {},
            });
        }

        const roles = await InvestigationOrganizationChartModel.aggregate([
            {
                $match: {
                    project: projectId,
                    isDeleted: { $ne: true },
                },
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "employee",
                    foreignField: "_id",
                    as: "employeeDetails",
                },
            },
            { $unwind: "$employeeDetails" },
            {
                $lookup: {
                    from: "roles",
                    localField: "role",
                    foreignField: "_id",
                    as: "roleDetails",
                },
            },
            { $unwind: "$roleDetails" },
            {
                $lookup: {
                    from: "teams",
                    localField: "team",
                    foreignField: "_id",
                    as: "teamDetails",
                },
            },
            {
                $unwind: {
                    path: "$teamDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "from",
                    foreignField: "_id",
                    as: "fromDetails",
                },
            },
            {
                $unwind: {
                    path: "$fromDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 1,
                    project: 1,
                    incident: 1,
                    priority: 1,
                    employee: {
                        _id: "$employeeDetails._id",
                        name: "$employeeDetails.name",
                        email: "$employeeDetails.email",
                        designation: "$employeeDetails.designation",
                        title: "$roleDetails.title",
                        team: "$teamDetails.name",
                    },
                    from: {
                        _id: "$fromDetails._id",
                        name: "$fromDetails.name",
                        email: "$fromDetails.email",
                    },
                    role: {
                        _id: "$roleDetails._id",
                        name: "$roleDetails.title",
                    },
                },
            },
        ]);

        console.log("Aggregation result - roles:", roles);

        if (!roles.length) {
            return res.status(200).json({
                success: true,
                message: "No investigation org chart found",
                data: {},
            });
        }

        const rolesByPriority: Record<number, Record<string, any>> = {};

        roles.forEach((role) => {
            const { priority, from } = role;
            if (!priority) return;
            if (!rolesByPriority[priority]) {
                rolesByPriority[priority] = {};
            }
            const fromKey = from?._id ? from?._id.toString() : "Unassigned";

            if (!rolesByPriority[priority][fromKey]) {
                rolesByPriority[priority][fromKey] = {
                    fromEmployee: role.from || null,
                    roles: [],
                };
            }

            rolesByPriority[priority][fromKey].roles.push(role);
        });

        return res.status(200).json({
            success: true,
            message: "Investigation Organization Chart fetched successfully",
            data: rolesByPriority,
        });
    } catch (error) {
        console.error("Error fetching Investigation Organization Chart:", error);
        return res.status(500).json({
            success: false,
            error: req.i18n.t("common.serverError"),
        });
    }
};

export const addInvestigationOrgChart = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { from, to, role, employee, team, incident } = req.body;

    console.log("=== ADD INVESTIGATION ORG CHART ===");
    console.log("projectId:", id);
    console.log("from:", from);
    console.log("to:", to);
    console.log("role:", role);
    console.log("employee:", employee);
    console.log("===================================");

    try {
        // Validate projectId
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(200).json({
                success: false,
                error: "Invalid project ID",
            });
        }

        const projectId = new mongoose.Types.ObjectId(id);
        const isProjectExist = await ProjectModel.findById(projectId);

        if (!isProjectExist) {
            return res.status(200).json({
                success: false,
                error: `${req.i18n.t("projectValidationMessages.response.notExist")} ${id}`,
            });
        }

        if (!role) {
            return res.status(200).json({
                success: false,
                error: "Role is required",
            });
        }

        if (!employee) {
            return res.status(200).json({
                success: false,
                error: "Employee is required",
            });
        }

        // Find the Investigation Specialist role
        const investigationRole = await RoleModel.findOne({
            title: InvestigationRoles.INVESTIGATION_SPECIALIST,
        });

        if (!investigationRole) {
            return res.status(200).json({
                success: false,
                error: "Investigation Specialist role not found in database",
            });
        }

        // Get existing charts count for priority
        const existingCount = await InvestigationOrganizationChartModel.countDocuments({ 
            project: projectId, 
            isDeleted: { $ne: true } 
        });

        // Calculate priority similar to Project Organization Chart
        let priority = 1;
        
        if (from && !to) {
            // If "from" is specified, priority = fromEmployee.priority + 1
            const fromChart = await InvestigationOrganizationChartModel.findOne({
                project: projectId,
                employee: from,
                isDeleted: { $ne: true }
            });
            if (fromChart && fromChart.priority) {
                priority = fromChart.priority + 1;
            }
        } else if (!from && !to) {
            // If no from/to, this becomes the Owner (priority = 1)
            priority = 1;
        } else {
            // For other cases, use existing logic
            priority = existingCount + 1;
        }

        // Find team for employee
        let teamId;
        const teams = await TeamModel.find({ members: employee });
        if (teams.length > 0) {
            teamId = teams[0]._id;
        }

        console.log("Creating new chart entry...");
        console.log("projectId:", projectId);
        console.log("employee:", employee);
        console.log("role:", role);
        console.log("investigationRole._id:", investigationRole._id);
        console.log("priority:", priority);

        const newChart = new InvestigationOrganizationChartModel({
            project: projectId,
            incident: incident ? new mongoose.Types.ObjectId(incident) : undefined,
            from: from ? new mongoose.Types.ObjectId(from) : undefined,
            to: to ? new mongoose.Types.ObjectId(to) : undefined,
            team: teamId,
            employee: new mongoose.Types.ObjectId(employee),
            role: new mongoose.Types.ObjectId(role), // Use the role sent from frontend
            priority: priority,
        });

        console.log("Saving newChart...");
        
        await newChart.save();

        console.log("Saved successfully!");
        console.log("newChart:", newChart);

        return res.status(201).json({
            success: true,
            message: "Investigation Organization Chart added successfully",
            data: newChart,
        });
    } catch (error) {
        console.error("Error adding Investigation Organization Chart:", error);
        return res.status(500).json({
            success: false,
            error: req.i18n.t("common.serverError"),
        });
    }
};
