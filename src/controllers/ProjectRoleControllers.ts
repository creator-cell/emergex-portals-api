import { Request, Response } from "express";
import ProjectModel from "../models/ProjectModel";
import TeamModel from "../models/TeamModel";
import mongoose from "mongoose";
import EmployeeModel from "../models/EmployeeModel";
import ProjectRoleModel from "../models/ProjectRoleModel";
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
          "projectRoleValidationMessages.response.addRolesInProject.empty"
        ),
      });
    }

    const roleValidationPromises = roles.map(
      async (role: {
        roleId: mongoose.Types.ObjectId;
        assignTo: mongoose.Types.ObjectId;
        roleDescription: string;
      }) => {
        if (!role.roleId) {
          throw new Error(req.i18n.t("roleValidationMessages.id.empty"));
        }

        if (!role.assignTo) {
          throw new Error(req.i18n.t("employeeValidationMessages.id.empty"));
        }

        if (!mongoose.isValidObjectId(role.roleId)) {
          throw new Error(req.i18n.t("roleValidationMessages.id.invalidId"));
        }
        if (!mongoose.isValidObjectId(role.assignTo)) {
          throw new Error(
            req.i18n.t("employeeValidationMessages.id.invalidMongooseFormat")
          );
        }

        const roleId = new mongoose.Types.ObjectId(role.roleId);
        const employeeId = new mongoose.Types.ObjectId(role.assignTo);

        const roleExists = await RoleModel.findOne({ _id: roleId });
        if (!roleExists) {
          throw new Error(
            `${req.i18n.t("roleValidationMessages.response.notFound")} ${
              role.roleId
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

        const teams = await TeamModel.find({ members: employeeId })
          .populate("members", "name")
          .exec();

        if (teams.length === 0) {
          throw new Error(
            `${req.i18n.t(
              "teamValidationMessages.response.noTeamFoundForEmployee"
            )} ${role.assignTo}.`
          );
        }

        const teamId = new mongoose.Types.ObjectId(
          (teams[0]._id as mongoose.Types.ObjectId).toString()
        );

        // const isEmployeePartOfTeam = teamExists.members.includes(role.assignTo);
        // if (!isEmployeePartOfTeam) {
        //   throw new Error(
        //     `${req.i18n.t(
        //       "teamValidationMessages.response.removeMemberFromTeam.alreadyNotinTeam"
        //     )} ${role.assignTo}.`
        //   );
        // }

        return {
          role: roleId,
          employee: employeeId,
          description: role.roleDescription,
          project: id,
          team: teamId,
        };
      }
    );

    let resolveRoles: any = await Promise.all(roleValidationPromises);

    // await ProjectModel.findByIdAndUpdate(
    //   id,
    //   { $push: { roles: { $each: resolveRoles } } },
    //   { new: true }
    // );

    await ProjectRoleModel.insertMany(resolveRoles);

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectRoleValidationMessages.response.addRolesInProject.success"
      ),
    });
  } catch (error: any) {
    console.error("Error ind adding roles in project:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: req.i18n.t(
        "projectRoleValidationMessages.response.addRolesInProject.server"
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
          "projectRoleValidationMessages.response.updateSpecificRole.notFound"
        ),
      });
    }
    const role = await ProjectRoleModel.findOne({ _id: roleId, project: id });
    if (!role) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "projectRoleValidationMessages.response.updateSpecificRole.roleNotAvailable"
        ),
      });
    }

    const { role: newRoleId, employee, description } = newRoleDetails;
    if (newRoleId) {
      const roleDetails = await RoleModel.findById(newRoleId);
      if (!roleDetails) {
        return res.status(200).json({
          success: false,
          error: `${req.i18n.t(
            "projectRoleValidationMessages.response.updateSpecificRole.roleNotFound"
          )} ${newRoleId}`,
        });
      }
      role.role = new mongoose.Types.ObjectId(newRoleId);
    }

    if (employee) {
      const employeeExists = await EmployeeModel.findById(employee);
      if (!employeeExists) {
        return res.status(200).json({
          success: false,
          error: `${req.i18n.t(
            "projectRoleValidationMessages.response.updateSpecificRole.employeeNotFound"
          )} ${employee}`,
        });
      }
      role.employee = new mongoose.Types.ObjectId(employee);

      const teams = await TeamModel.find({ members: employee })
        .populate("members", "name")
        .exec();

      if (teams.length === 0) {
        throw new Error(
          `${req.i18n.t(
            "teamValidationMessages.response.noTeamFoundForEmployee"
          )} ${role.employee}.`
        );
      }

      const teamId = new mongoose.Types.ObjectId(
        (teams[0]._id as mongoose.Types.ObjectId).toString()
      );
      role.team = teamId;
    }

    if (description) {
      role.description = description;
    }

    await role.save();

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectRoleValidationMessages.response.updateSpecificRole.success"
      ),
      data: role,
    });
  } catch (error) {
    console.error("Error updating specific role:", error);
    return res.status(500).json({
      success: false,
      message: req.i18n.t(
        "projectRoleValidationMessages.response.updateSpecificRole.server"
      ),
    });
  }
};

// add priority to given role
export const updateRolePriority = async (req: Request, res: Response) => {
  try {
    const { from, to, role: roleId, employee } = req.body;
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

    let role = await ProjectRoleModel.findOne({ project: id, employee });

    if (!role) {
      if (roleId) {
        const existingRole = await RoleModel.findById(roleId);
        if (!existingRole) {
          return res.status(200).json({
            success: false,
            message: req.i18n.t("roleValidationMessages.response.notExist"),
          });
        }

        const existingEmployee = await EmployeeModel.findById(employee);
        if (!existingEmployee) {
          return res.status(200).json({
            success: false,
            message: req.i18n.t("employeeValidationMessages.response.notExist"),
          });
        }

        const teams = await TeamModel.find({ members: employee })
          .populate("members", "name")
          .exec();

        if (teams.length === 0) {
          throw new Error(
            `${req.i18n.t(
              "teamValidationMessages.response.noTeamFoundForEmployee"
            )} ${employee}.`
          );
        }

        const team = new mongoose.Types.ObjectId(
          (teams[0]._id as mongoose.Types.ObjectId).toString()
        );

        role = new ProjectRoleModel({
          project: id,
          team,
          employee,
          role: roleId,
        });
        await role.save();
      }
    }

    if (!role) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "projectRoleValidationMessages.response.updateRolePriority.notFound"
        ),
      });
    }

    // Priority update logic
    if (!from && !to) {
      role.priority = 1;
    } else if (from && !to) {
      const fromRole = await ProjectRoleModel.findOne({
        project: id,
        employee: from,
      });
      if (!fromRole) {
        return res.status(200).json({
          success: false,
          message: req.i18n.t(
            "projectRoleValidationMessages.response.updateRolePriority.fromNotFound"
          ),
        });
      }
      role.priority = fromRole.priority + 1;
      role.from = from;
    } else if (!from && to) {
      const toRole = await ProjectRoleModel.findOne({
        project: id,
        employee: to,
      });
      if (!toRole) {
        return res.status(200).json({
          success: false,
          message: req.i18n.t(
            "projectRoleValidationMessages.response.updateRolePriority.toNotFound"
          ),
        });
      }
      role.priority = toRole.priority;
      role.from = toRole.from;
      role.to = to;
      toRole.from = role.employee;
      await ProjectRoleModel.updateMany(
        {
          project: id,
          priority: { $gte: toRole.priority },
        },
        { $inc: { priority: 1 } }
      );

      await toRole.save();
    } else if (from && to) {
      const fromRole = await ProjectRoleModel.findOne({
        project: id,
        employee: from,
      });
      const toRole = await ProjectRoleModel.findOne({
        project: id,
        employee: to,
      });

      if (!fromRole || !toRole) {
        return res.status(200).json({
          success: false,
          message: req.i18n.t(
            "projectRoleValidationMessages.response.updateRolePriority.toNotFound"
          ),
        });
      }

      let newFromPriority = fromRole.priority + 1;
      let newToPriority = toRole.priority - 1;

      if (newFromPriority !== newToPriority) {
        return res.status(400).json({
          success: false,
          error: req.i18n.t(
            "projectRoleValidationMessages.response.updateRolePriority.conflict"
          ),
        });
      }

      role.priority = fromRole.priority + 1;
      role.from = from;
      role.to = to;
      toRole.from = role.employee;
      await ProjectRoleModel.updateMany(
        {
          project: id,
          priority: { $gte: toRole.priority },
        },
        { $inc: { priority: 1 } }
      );

      await toRole.save();
    } else {
      return res.status(400).json({
        success: false,
        message: req.i18n.t(
          "projectRoleValidationMessages.response.updateRolePriority.invalid"
        ),
      });
    }

    if(roleId){
      role.role = new mongoose.Types.ObjectId(roleId);
    }

    await role.save();

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectRoleValidationMessages.response.updateRolePriority.success"
      ),
      role,
    });
  } catch (error) {
    console.error("Error updating role priority:", error);
    return res.status(500).json({
      success: false,
      message: req.i18n.t(
        "projectRoleValidationMessages.response.updateRolePriority.server"
      ),
    });
  }
};

export const getProjectRolesByPriority = async (
  req: Request,
  res: Response
) => {
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
    const roles = await ProjectRoleModel.aggregate([
      { $match: { project: projectId } },
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
      { $unwind: "$teamDetails" },
      {
        $lookup: {
          from: "employees",
          localField: "from",
          foreignField: "_id",
          as: "fromDetails",
        },
      },
      { $unwind: { path: "$fromDetails", preserveNullAndEmptyArrays: true } },
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
          },
          from: {
            _id: "$fromDetails._id",
            name: "$fromDetails.name",
            email: "$fromDetails.email",
          },
          role: 1,
          team: {
            _id: "$teamDetails._id",
            name: "$teamDetails.name",
          },
          description: 1,
        },
      },
    ]);

    if (!roles.length) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "projectRoleValidationMessages.response.getProjectRolesByPriority.notFound"
        ),
      });
    }

    // console.log("roles: ", roles);

    // Organizing roles first by priority, then by 'from'
    const rolesByPriority: Record<number, Record<string, any>> = {};

    roles.forEach((role) => {
      const { priority, from } = role;
      if (!rolesByPriority[priority]) {
        rolesByPriority[priority] = {};
      }
      // console.log("from: ", from);
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
      message: req.i18n.t(
        "projectRoleValidationMessages.response.getProjectRolesByPriority.success"
      ),
      data: rolesByPriority,
    });
  } catch (error) {
    console.error("Error fetching project roles by priority:", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "projectRoleValidationMessages.response.getProjectRolesByPriority.server"
      ),
    });
  }
};
