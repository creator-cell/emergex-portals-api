import { Request, Response } from "express";
import mongoose from "mongoose";
import EmergexChartModel, { IEmergexChart } from "../models/EmergexChartModel";
import ProjectModel from "../models/ProjectModel";
import RoleModel from "../models/RoleModel";
import ProjectRoleModel from "../models/ProjectRoleModel";
import EmployeeModel from "../models/EmployeeModel";
import TeamModel from "../models/TeamModel";
import { updateDownstreamNodePriorities } from "../helper/EmergexChartFunctions";
import IncidentModel from "../models/IncidentModel";
import ConversationModel from "../models/ConversationModel";
import { ConversationIdentity } from "../config/global-enum";
import conversationService from "../services/conversation.service";
import UserModel from "../models/UserModel";


// Fetch employees for a project who have the 'Emergex' role
export const getEmergexEmployeesByProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;

  try {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const emergexRole = await RoleModel.findOne({ title: "Emergex" });
    if (!emergexRole) {
      return res.status(404).json({
        success: false,
        message: "Emergex role not found.",
      });
    }

    // Find all project roles that match the project and the Emergex role
    const projectRoles = await ProjectRoleModel.find({
      project: projectId,
      role: emergexRole._id,
    }).populate("employee");

    // Extract employee details
    const emergexEmployees = projectRoles
      .map((pr) => {
        // Ensure employee is not null or undefined before accessing its properties
        if (pr.employee) {
          return {
            _id: (pr.employee as any)._id,
            name: (pr.employee as any).name,
            email: (pr.employee as any).email,
            designation: (pr.employee as any).designation,
            // Add other employee fields as needed
          };
        } else {
          return null;
        }
      })
      .filter(Boolean) as any[]; // Filter out nulls and assert type

    if (!emergexEmployees.length) {
      return res.status(200).json({
        success: true,
        message: "No employees found with the Emergex role in this project.",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Emergex employees fetched successfully.",
      data: emergexEmployees,
    });
  } catch (error) {
    console.error("Error fetching Emergex employees:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Emergex employees.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Add Emergex Chart entry
export const addEmergexChart = async (req: Request, res: Response) => {
  try {
    const { from, to, role: roleId, employee } = req.body;
    const { id } = req.params; // Project ID

    console.log("Emergex Chart - incoming data:", { id, from, to, roleId, employee });

    // Validate if the project exists
    const isProjectExist = await ProjectModel.findById(id);
    if (!isProjectExist) {
      return res.status(200).json({
        success: false,
        error: `Project not found with ID: ${id}`,
      });
    }

    let emergexChartEntry = await EmergexChartModel.findOne({ project: id, employee });

    console.log("Existing entry found:", emergexChartEntry);

    if (!emergexChartEntry) {
      console.log("Creating new entry for:", { roleId, employee });
      if (roleId && employee) {
        const existingRole = await RoleModel.findById(roleId);
        if (!existingRole) {
          return res.status(400).json({
            success: false,
            message: "Role not found.",
          });
        }

        const existingEmployee = await EmployeeModel.findById(employee);
        if (!existingEmployee) {
          return res.status(400).json({
            success: false,
            message: "Employee not found.",
          });
        }

        const teams = await TeamModel.find({ members: employee })
          .populate("members", "name")
          .exec();

        if (teams.length === 0) {
          console.log("No team found for employee:", existingEmployee.name, employee);
          return res.status(400).json({
            success: false,
            message: `No team found for employee ${existingEmployee.name}. Please assign employee to a team first.`,
          });
        }

        const team = new mongoose.Types.ObjectId(
          (teams[0]._id as mongoose.Types.ObjectId).toString()
        );

        console.log("Team found:", teams[0].name);

        emergexChartEntry = new EmergexChartModel({
          project: id,
          team,
          employee,
          role: roleId,
        });
        await emergexChartEntry.save();
        console.log("Emergex chart entry saved:", emergexChartEntry._id);

        const incidents = await IncidentModel.find({
          project: id,
        });

        if (incidents.length > 0) {
          const conversationPromises = incidents.map(async (incident) => {
            const conversation = await ConversationModel.findOne({
              identity: ConversationIdentity.INCIDENT,
              identityId: incident._id,
            });

            if (!conversation) {
              throw new Error(`Conversation not found for incident ${incident._id}.`);
            }

            await conversationService.addParticipant(
              (conversation._id as mongoose.Types.ObjectId).toString(),
              (existingEmployee.user as mongoose.Types.ObjectId).toString(),
              (existingEmployee.user as mongoose.Types.ObjectId).toString()
            );
          });

          try {
            await Promise.all(conversationPromises);
          } catch (convError) {
            console.log("Warning: Could not add participant to conversation:", convError);
          }
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Please select role and employee.",
        });
      }
    }

    // Priority update logic
    console.log("Processing priority logic:", { from, to, currentPriority: emergexChartEntry.priority });
    
    if (!from && !to) {
      emergexChartEntry.priority = 1;
      await emergexChartEntry.save();
      console.log("Set priority to 1 (owner)");
    } else if (from && !to) {
      const fromEntry = await EmergexChartModel.findOne({
        project: id,
        employee: from,
      });
      if (!fromEntry) {
        console.log("From employee not found in Emergex Chart:", from);
        return res.status(200).json({
          success: false,
          message: "From employee not found in Emergex Chart. Please add them to the chart first.",
        });
      }
      emergexChartEntry.priority = fromEntry.priority + 1;
      emergexChartEntry.from = from;
      await emergexChartEntry.save();
    } else if (!from && to) {
      const toEntry = await EmergexChartModel.findOne({
        project: id,
        employee: to,
      });
      if (!toEntry) {
        return res.status(200).json({
          success: false,
          message: "To employee not found in Emergex Chart.",
        });
      }
      emergexChartEntry.priority = toEntry.priority;
      emergexChartEntry.from = toEntry.from;
      emergexChartEntry.to = to;
      await emergexChartEntry.save();

      toEntry.priority = to.priority + 1; // This 'to' is likely meant to be 'emergexChartEntry.employee' or similar, not the 'to' from request body
      toEntry.from = emergexChartEntry.employee;
      await toEntry.save();

      await updateDownstreamNodePriorities(
        id,
        toEntry.employee,
        toEntry.priority
      );
    } else if (from && to) {
      const fromEntry = await EmergexChartModel.findOne({
        project: id,
        employee: from,
      });
      const toEntry = await EmergexChartModel.findOne({
        project: id,
        employee: to,
      });

      if (!fromEntry || !toEntry) {
        return res.status(200).json({
          success: false,
          message: "From or To employee not found in Emergex Chart.",
        });
      }

      let sameNodeCheckFrom = toEntry.from.toString() === from.toString();
      let newFromPriorityStatus = fromEntry.priority + 1 === toEntry.priority;
      let newToPriorityStatus = toEntry.priority - 1 === fromEntry.priority;

      if (
        !newFromPriorityStatus ||
        !newToPriorityStatus ||
        !sameNodeCheckFrom
      ) {
        return res.status(400).json({
          success: false,
          error: "Priority conflict in Emergex Chart.",
        });
      }

      emergexChartEntry.priority = fromEntry.priority + 1;
      emergexChartEntry.from = from;
      emergexChartEntry.to = to;
      await emergexChartEntry.save();

      toEntry.priority = toEntry.priority + 1;
      toEntry.from = emergexChartEntry.employee;
      await toEntry.save();

      await updateDownstreamNodePriorities(
        id,
        toEntry.employee,
        toEntry.priority
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid priority update request for Emergex Chart.",
      });
    }

    if (roleId) {
      emergexChartEntry.role = new mongoose.Types.ObjectId(roleId);
      console.log("Updated role to:", roleId);
    }
    await emergexChartEntry.save();

    console.log("Final emergexChartEntry:", {
      _id: emergexChartEntry._id,
      project: emergexChartEntry.project,
      employee: emergexChartEntry.employee,
      role: emergexChartEntry.role,
      team: emergexChartEntry.team,
      priority: emergexChartEntry.priority,
      from: emergexChartEntry.from,
      to: emergexChartEntry.to,
    });

    return res.status(200).json({
      success: true,
      message: "Emergex Chart entry added successfully!",
      emergexChartEntry,
    });
  } catch (error) {
    console.error("Error adding/updating Emergex Chart entry:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get Emergex Chart roles according to priority
export const getEmergexChartByPriority = async (req: Request, res: Response) => {
  const { id } = req.params; // Project ID

  try {
    const projectId = new mongoose.Types.ObjectId(id);
    const isProjectExist = await ProjectModel.findById(projectId);

    if (!isProjectExist) {
      return res.status(200).json({
        success: false,
        error: `Project not found with ID: ${id}`,
      });
    }

    const roles = await EmergexChartModel.aggregate([
      {
        $match: {
          project: projectId,
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
          description: 1,
        },
      },
    ]);

    if (!roles.length) {
      return res.status(200).json({
        success: true,
        message: "No Emergex Chart data available for this project.",
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
      message: "Emergex Chart data fetched successfully!",
      data: rolesByPriority,
    });
  } catch (error) {
    console.error("Error fetching Emergex Chart data:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
