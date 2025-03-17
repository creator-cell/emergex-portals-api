import { Request, Response } from "express";
import ProjectModel from "../models/ProjectModel";
import TeamModel from "../models/TeamModel";
import mongoose from "mongoose";
import EmployeeModel from "../models/EmployeeModel";
import RoleModel from "../models/RoleModel";

// add roles in projects
export const addRolesInProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { roles } = req.body;
  try {
    const project = await ProjectModel.findById(id);
    if (!project) {
      return res.status(400).json({
        success: false,
        error: req.i18n.t("projectValidationMessages.response.notExist") + id,
      });
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        error: req.i18n.t(
          "roleValidationMessages.response.addRolesInProject.empty"
        ),
      });
    }

    const roleValidationPromises = roles.map(
      async (role: {
        team: mongoose.Types.ObjectId;
        assignTo: mongoose.Types.ObjectId;
        roleDescription: string;
      }) => {
        if (!role.team) {
          throw new Error(req.i18n.t("teamValidationMessages.id.empty"));
        }

        if (!role.assignTo) {
          throw new Error(req.i18n.t("employeeValidationMessages.id.empty"));
        }

        if (!mongoose.isValidObjectId(role.team)) {
          throw new Error(
            req.i18n.t("teamValidationMessages.id.invalidMongooseFormat")
          );
        }
        if (!mongoose.isValidObjectId(role.assignTo)) {
          throw new Error(
            req.i18n.t("employeeValidationMessages.id.invalidMongooseFormat")
          );
        }

        const teamId = new mongoose.Types.ObjectId(role.team);
        const employeeId = new mongoose.Types.ObjectId(role.assignTo);

        const teamExists = await TeamModel.findOne({ _id: teamId });
        if (!teamExists) {
          throw new Error(
            `${req.i18n.t("teamValidationMessages.response.teamNotExist")} ${
              role.team
            }.`
          );
        }

        const employeeExists = await EmployeeModel.exists({
          _id: employeeId,
        });
        if (!employeeExists) {
          throw new Error(
            `${req.i18n.t("employeeValidationMessages.response.notExist")} ${
              role.assignTo
            }.`
          );
        }

        const isEmployeePartOfTeam = teamExists.members.includes(role.assignTo);
        if (!isEmployeePartOfTeam) {
          throw new Error(
            `${req.i18n.t(
              "teamValidationMessages.response.removeMemberFromTeam.alreadyNotinTeam"
            )} ${role.assignTo}.`
          );
        }
        return {
          team: teamId,
          employee: employeeId,
          description: role.roleDescription,
          project: id,
        };
      }
    );

    let resolveRoles: any = await Promise.all(roleValidationPromises);

    // await ProjectModel.findByIdAndUpdate(
    //   id,
    //   { $push: { roles: { $each: resolveRoles } } },
    //   { new: true }
    // );

    await RoleModel.insertMany(resolveRoles);

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "roleValidationMessages.response.addRolesInProject.success"
      ),
    });
  } catch (error: any) {
    console.error("Error ind adding roles in project:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: req.i18n.t(
        "roleValidationMessages.response.addRolesInProject.server"
      ),
    });
  }
};

// update role details
export const updateSpecificRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { roleId, newRoleDetails } = req.body;

  try {
    const project = await ProjectModel.findById(id);
    if (!project) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "roleValidationMessages.response.updateSpecificRole.notFound"
        ),
      });
    }
    const role = await RoleModel.findOne({ _id: roleId, project: id });
    if (!role) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "roleValidationMessages.response.updateSpecificRole.roleNotAvailable"
        ),
      });
    }

    const { team, employee, description } = newRoleDetails;
    if (team) {
      const teamDetails = await TeamModel.findById(team);
      if (!teamDetails) {
        return res.status(200).json({
          success: false,
          error: `${req.i18n.t(
            "roleValidationMessages.response.updateSpecificRole.teamNotFound"
          )} ${team}`,
        });
      }
      role.team = new mongoose.Types.ObjectId(team);
    }

    if (employee) {
      const employeeExists = await EmployeeModel.findById(employee);
      if (!employeeExists) {
        return res.status(200).json({
          success: false,
          error: `${req.i18n.t(
            "roleValidationMessages.response.updateSpecificRole.employeeNotFound"
          )} ${employee}`,
        });
      }
      role.employee = new mongoose.Types.ObjectId(employee);
    }

    if (team && employee) {
      const teamDetails = await TeamModel.findById(team);
      if (teamDetails && !teamDetails.members.includes(employee)) {
        return res.status(200).json({
          success: false,
          error: req.i18n.t(
            "teamValidationMessages.response.removeMemberFromTeam.alreadyNotinTeam"
          ),
        });
      }
    }

    if (description) {
      role.description = description;
    }

    await role.save();

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "roleValidationMessages.response.updateSpecificRole.success"
      ),
      data: role,
    });
  } catch (error) {
    console.error("Error updating specific role:", error);
    return res.status(500).json({
      success: false,
      message: req.i18n.t(
        "roleValidationMessages.response.updateSpecificRole.server"
      ),
    });
  }
};

// add priority to given role
export const updateRolePriority = async (req: Request, res: Response) => {
  try {
    const { from, to, team, employee } = req.body;
    const { id } = req.params;

    // Validate if the project exists
    const isProjectExist = await ProjectModel.findById(id);
    if (!isProjectExist) {
      return res.status(200).json({
        success: false,
        error: `${req.i18n.t(
          "projectValidationMessages.response.notExist"
        )} ${id}`,
      });
    }

    let role = await RoleModel.findOne({ project: id, employee });

    if (!role) {
      if (team) {
        const existingTeam = await TeamModel.findById(team);
        if (!existingTeam) {
          return res.status(200).json({
            success: false,
            message: req.i18n.t("teamValidationMessages.response.notExist"),
          });
        }

        if (!existingTeam.members.includes(employee)) {
          return res.status(400).json({
            success: false,
            message: req.i18n.t(
              "teamValidationMessages.response.removeMemberFromTeam.alreadyNotinTeam"
            ),
          });
        }

        role = new RoleModel({ project: id, team, employee });
        await role.save();
      }
    }

    if (!role) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "roleValidationMessages.response.updateRolePriority.notFound"
        ),
      });
    }

    // Priority update logic
    if (!from && !to) {
      role.priority = 1;
    } 
    else if (from && !to) {
      const fromRole = await RoleModel.findOne({ project: id, employee: from });
      if (!fromRole) {
        return res.status(200).json({
          success: false,
          message: req.i18n.t(
            "roleValidationMessages.response.updateRolePriority.fromNotFound"
          ),
        });
      }
      role.priority = fromRole.priority + 1;
      role.from=from;
    } 
    else if (!from && to) {
      const toRole = await RoleModel.findOne({ project: id, employee: to });
      if (!toRole) {
        return res.status(200).json({
          success: false,
          message: req.i18n.t(
            "roleValidationMessages.response.updateRolePriority.toNotFound"
          ),
        });
      }
      role.priority = toRole.priority;
      role.from = toRole.from;
      role.to = to;
      toRole.from = role.employee;
      await RoleModel.updateMany(
        { 
          project: id, 
          priority: { $gte: toRole.priority }
        },
        { $inc: { priority: 1 } }
      );
      
      await toRole.save();
    } 
    else if (from && to) {
      const fromRole = await RoleModel.findOne({ project: id, employee: from });
      const toRole = await RoleModel.findOne({ project: id, employee: to });

      if (!fromRole || !toRole) {
        return res.status(200).json({
          success: false,
          message: req.i18n.t(
            "roleValidationMessages.response.updateRolePriority.toNotFound"
          ),
        });
      }

      let newFromPriority = fromRole.priority + 1;
      let newToPriority = toRole.priority - 1;

      if (newFromPriority !== newToPriority) {
        return res.status(400).json({
          success: false,
          error: req.i18n.t(
            "roleValidationMessages.response.updateRolePriority.conflict"
          ),
        });
      }

      role.priority = fromRole.priority + 1;
      role.from = from;
      role.to = to;
      toRole.from = role.employee;
      await RoleModel.updateMany(
        { 
          project: id, 
          priority: { $gte: toRole.priority }
        },
        { $inc: { priority: 1 } }
      );
      
      await toRole.save();
    } else {
      return res.status(400).json({
        success: false,
        message: req.i18n.t(
          "roleValidationMessages.response.updateRolePriority.invalid"
        ),
      });
    }

    await role.save();

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "roleValidationMessages.response.updateRolePriority.success"
      ),
      role,
    });
  } catch (error) {
    console.error("Error updating role priority:", error);
    return res.status(500).json({
      success: false,
      message: req.i18n.t(
        "roleValidationMessages.response.updateRolePriority.server"
      ),
    });
  }
};

export const getProjectRolesByPriority = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const projectId = new mongoose.Types.ObjectId(id);
    const isProjectExist = await ProjectModel.findById(projectId);

    if (!isProjectExist) {
      return res.status(200).json({
        success: false,
        error: `${req.i18n.t(
          "projectValidationMessages.response.notExist"
        )} ${id}`,
      });
    }

    // Fetch all roles for the given project with populated employee details
    const roles = await RoleModel.find({ project: projectId })
      .populate("employee", "name email designation")
      .populate("from", "name email")

    if (!roles.length) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "roleValidationMessages.response.getProjectRolesByPriority.notFound"
        ),
      });
    }

    // Organizing roles first by priority, then by 'from'
    const rolesByPriority: Record<number, Record<string, any>> = {};

    roles.forEach((role) => {
      const { priority, from } = role;
      if (!rolesByPriority[priority]) {
        rolesByPriority[priority] = {};
      }
      const fromKey = from?._id.toString() || "Unassigned";

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
      message: req.i18n.t(
        "roleValidationMessages.response.getProjectRolesByPriority.success"
      ),
      data: rolesByPriority,
    });
  } catch (error) {
    console.error("Error fetching project roles by priority:", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "roleValidationMessages.response.getProjectRolesByPriority.server"
      ),
    });
  }
};

