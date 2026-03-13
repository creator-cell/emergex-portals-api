import { Request, Response } from "express";
import mongoose from "mongoose";
import InvestigationChartModel from "../models/InvestigationChartModel";
import ProjectModel from "../models/ProjectModel";
import RoleModel from "../models/RoleModel";
import ProjectRoleModel from "../models/ProjectRoleModel";
import EmployeeModel from "../models/EmployeeModel";
import TeamModel from "../models/TeamModel";
import { updateDownstreamNodePriorities } from "../helper/InvestigationChartFunctions";

export const getInvestigationEmployeesByProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;

  try {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const investigationRole = await RoleModel.findOne({ title: "Investigation Specialist" });
    if (!investigationRole) {
      return res.status(404).json({
        success: false,
        message: "Investigation Specialist role not found.",
      });
    }

    const projectRoles = await ProjectRoleModel.find({
      project: projectId,
      role: investigationRole._id,
    }).populate("employee");

    const investigationEmployees = projectRoles
      .map((pr) => {
        if (pr.employee) {
          return {
            _id: (pr.employee as any)._id,
            name: (pr.employee as any).name,
            email: (pr.employee as any).email,
            designation: (pr.employee as any).designation,
          };
        } else {
          return null;
        }
      })
      .filter(Boolean) as any[];

    if (!investigationEmployees.length) {
      return res.status(200).json({
        success: true,
        message: "No employees found with the Investigation Specialist role in this project.",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Investigation Specialist employees fetched successfully.",
      data: investigationEmployees,
    });
  } catch (error) {
    console.error("Error fetching Investigation Specialist employees:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Investigation Specialist employees.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const addInvestigationChart = async (req: Request, res: Response) => {
  try {
    const { from, to, role: roleId, employee } = req.body;
    const { id } = req.params;

    console.log("Investigation Chart - incoming data:", { id, from, to, roleId, employee });

    const isProjectExist = await ProjectModel.findById(id);
    if (!isProjectExist) {
      return res.status(200).json({
        success: false,
        error: `Project not found with ID: ${id}`,
      });
    }

    let investigationChartEntry = await InvestigationChartModel.findOne({ project: id, employee });

    console.log("Existing entry found:", investigationChartEntry);

    if (!investigationChartEntry) {
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

        investigationChartEntry = new InvestigationChartModel({
          project: id,
          team,
          employee,
          role: roleId,
        });
        await investigationChartEntry.save();
        console.log("Investigation chart entry saved:", investigationChartEntry._id);
      } else {
        return res.status(400).json({
          success: false,
          message: "Please select role and employee.",
        });
      }
    }

    console.log("Processing priority logic:", { from, to, currentPriority: investigationChartEntry.priority });
    
    if (!from && !to) {
      investigationChartEntry.priority = 1;
      await investigationChartEntry.save();
      console.log("Set priority to 1 (owner)");
    } else if (from && !to) {
      const fromEntry = await InvestigationChartModel.findOne({
        project: id,
        employee: from,
      });
      if (!fromEntry) {
        console.log("From employee not found in Investigation Chart:", from);
        return res.status(200).json({
          success: false,
          message: "From employee not found in Investigation Chart. Please add them to the chart first.",
        });
      }
      investigationChartEntry.priority = fromEntry.priority + 1;
      investigationChartEntry.from = from;
      await investigationChartEntry.save();
    } else if (!from && to) {
      const toEntry = await InvestigationChartModel.findOne({
        project: id,
        employee: to,
      });
      if (!toEntry) {
        return res.status(200).json({
          success: false,
          message: "To employee not found in Investigation Chart.",
        });
      }
      investigationChartEntry.priority = toEntry.priority;
      investigationChartEntry.from = toEntry.from;
      investigationChartEntry.to = to;
      await investigationChartEntry.save();

      toEntry.priority = to.priority + 1;
      toEntry.from = investigationChartEntry.employee;
      await toEntry.save();

      await updateDownstreamNodePriorities(
        id,
        toEntry.employee,
        toEntry.priority
      );
    } else if (from && to) {
      const fromEntry = await InvestigationChartModel.findOne({
        project: id,
        employee: from,
      });
      const toEntry = await InvestigationChartModel.findOne({
        project: id,
        employee: to,
      });

      if (!fromEntry || !toEntry) {
        return res.status(200).json({
          success: false,
          message: "From or To employee not found in Investigation Chart.",
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
          error: "Priority conflict in Investigation Chart.",
        });
      }

      investigationChartEntry.priority = fromEntry.priority + 1;
      investigationChartEntry.from = from;
      investigationChartEntry.to = to;
      await investigationChartEntry.save();

      toEntry.priority = toEntry.priority + 1;
      toEntry.from = investigationChartEntry.employee;
      await toEntry.save();

      await updateDownstreamNodePriorities(
        id,
        toEntry.employee,
        toEntry.priority
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid priority update request for Investigation Chart.",
      });
    }

    if (roleId) {
      investigationChartEntry.role = new mongoose.Types.ObjectId(roleId);
      console.log("Updated role to:", roleId);
    }
    await investigationChartEntry.save();

    console.log("Final investigationChartEntry:", {
      _id: investigationChartEntry._id,
      project: investigationChartEntry.project,
      employee: investigationChartEntry.employee,
      role: investigationChartEntry.role,
      team: investigationChartEntry.team,
      priority: investigationChartEntry.priority,
      from: investigationChartEntry.from,
      to: investigationChartEntry.to,
    });

    return res.status(200).json({
      success: true,
      message: "Investigation Chart entry added successfully!",
      investigationChartEntry,
    });
  } catch (error) {
    console.error("Error adding/updating Investigation Chart entry:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getInvestigationChartByPriority = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const projectId = new mongoose.Types.ObjectId(id);
    const isProjectExist = await ProjectModel.findById(projectId);

    if (!isProjectExist) {
      return res.status(200).json({
        success: false,
        error: `Project not found with ID: ${id}`,
      });
    }

    const roles = await InvestigationChartModel.aggregate([
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
        message: "No Investigation Chart data available for this project.",
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
      message: "Investigation Chart data fetched successfully!",
      data: rolesByPriority,
    });
  } catch (error) {
    console.error("Error fetching Investigation Chart data:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
