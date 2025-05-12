import { Request, Response } from "express";
import ProjectModel from "../models/ProjectModel";
import TeamModel from "../models/TeamModel";
import mongoose from "mongoose";
import EmployeeModel from "../models/EmployeeModel";
import ProjectRoleModel from "../models/ProjectRoleModel";
import RoleModel from "../models/RoleModel";
import { ICustomRequest } from "../types/express";
import IncidentModel from "../models/IncidentModel";
import ConversationModel, {
  ConversationIdentity,
  ConversationType,
} from "../models/ConversationModel";
import conversationService from "../services/conversation.service";

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

    const employeeIds = resolveRoles.map((role: any) => role.employee);
    const employees = await EmployeeModel.find({
      _id: { $in: employeeIds },
    });

    const userIds = employees.map((employee) => employee.user);

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
          throw new Error(
            `${req.i18n.t(
              "conversationValidationMessages.response.notFound"
            )} ${incident._id}.`
          );
        }

        await Promise.all(
          userIds.map(async (userId) => {
            await conversationService.addParticipant(
              (conversation._id as mongoose.Types.ObjectId).toString(),
              (userId as mongoose.Types.ObjectId).toString(),
              (userId as mongoose.Types.ObjectId).toString()
            );
          })
        );
      });

      await Promise.all(conversationPromises);
    }

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
              throw new Error(
                `${req.i18n.t(
                  "conversationValidationMessages.response.notFound"
                )} ${incident._id}.`
              );
            }
            
                await conversationService.addParticipant(
                  (conversation._id as mongoose.Types.ObjectId).toString(),
                  (existingEmployee.user as mongoose.Types.ObjectId).toString(),
                  (existingEmployee.user as mongoose.Types.ObjectId).toString()
                );
          });
    
          await Promise.all(conversationPromises);
        }

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

    if (roleId) {
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

// get project roles according to priority
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

// get user project role details by incident
export const getUserRoleDetails = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  const { id } = req.params;
  try {
    const incident = await IncidentModel.findById(id);
    if (!incident) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t("incidentValidationMessages.response.notFound"),
      });
    }

    const employee = await EmployeeModel.findOne({
      user: currentUser.id,
    });

    if (!employee) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "employeeValidationMessages.response.getEmployeeById.notFound"
        ),
      });
    }

    const roleData = await ProjectRoleModel.findOne({
      project: incident.project,
      employee: employee._id,
    }).populate("employee role");

    if (!roleData) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "projectRoleValidationMessages.response.getUserRoleDetails.roleNotAvailable"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectRoleValidationMessages.response.getUserRoleDetails.success"
      ),
      data: roleData,
    });
  } catch (error) {
    console.log("error in fetching role data: ", error);
    return res.status(200).json({
      success: false,
      error: req.i18n.t(
        "projectRoleValidationMessages.response.getUserRoleDetails.server"
      ),
    });
  }
};

// get roles by incident id
export const getRolesByIncidentId = async (req: Request, res: Response) => {
  const { id } = req.params;
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  const currentUserId = currentUser.id;
  console.log("current User: ",currentUser)
  try {
    const incident = await IncidentModel.findById(id);
    if (!incident) {
      return res.status(200).json({
        success: false,
        error:
          req.i18n.t("incidentValidationMessages.response.notExist") + " " + id,
      });
    }

    const project = await ProjectModel.findById(incident.project);
    if (!project) {
      return res.status(200).json({
        success: false,
        error:
          req.i18n.t("projectValidationMessages.response.notExist") +
          " " +
          incident.project,
      });
    }

    const rolesPipeline = [
      {
        $match: {
          project: project._id,
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleData",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeData",
        },
      },
      {
        $unwind: {
          path: "$roleData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$employeeData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$role",
          role: { $first: "$roleData" },
          employees: {
            $push: {
              _id: "$employeeData._id",
              name: "$employeeData.name",
              email: "$employeeData.email",
              designation: "$employeeData.designation",
              description: "$description",
              title: "$roleData.title",
              user: "$employeeData.user", 
              isCurrentUser: { $eq: ["$employeeData.user", new mongoose.Types.ObjectId(currentUserId)] } 
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          role: 1,
          employees: 1,
        },
      },
    ];

    let roles = await ProjectRoleModel.aggregate(rolesPipeline);

    // Fetch conversations for each employee (except current user)
    roles = await Promise.all(
      roles.map(async (role) => {
        const employeesWithConversations = await Promise.all(
          role.employees.map(async (employee: any) => {
            // Skip if this is the current user's employee record
            console.log("iscUrrent: ",employee)
            if (employee.isCurrentUser) {
              const { isCurrentUser, ...employeeData } = employee;
              return employeeData;
            }
            
            if (!employee.user) return employee;
            
            // Find conversation where both current user and employee's user are participants
            const conversation = await ConversationModel.findOne({
              type: ConversationType.SINGLE,
              participants: {
                $all: [
                  { $elemMatch: { user: currentUserId } },
                  { $elemMatch: { user: employee.user } }
                ]
              }
            }).select('twilioSid name type identity');

            return {
              ...employee,
              conversation: conversation ?? null,
              isCurrentUser: undefined // Remove the flag from final output
            };
          })
        );

        return {
          ...role,
          employees: employeesWithConversations
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectRoleValidationMessages.response.getRolesByIncidentId.success"
      ),
      data: roles,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "projectRoleValidationMessages.response.getRolesByIncidentId.server"
      ),
    });
  }
};

export const getUserRoleInIncident = async (req: Request, res: Response) => {
  const { id } = req.params;
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const incident = await IncidentModel.findById(id);
    if (!incident) {
      return res.status(200).json({
        success: false,
        error:
          req.i18n.t("incidentValidationMessages.response.notExist") + " " + id,
      });
    }

    // console.log("incident: ", incident);

    const project = await ProjectModel.findOne({ _id: incident.project });

    if (!project) {
      return res.status(200).json({
        success: false,
        error:
          req.i18n.t("projectValidationMessages.response.notExist") +
          " " +
          incident.project,
      });
    }

    const employee = await EmployeeModel.findOne({
      user: currentUser.id,
    });

    if (!employee) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "employeeValidationMessages.response.getEmployeeById.notFound"
        ),
      });
    }

    // console.log("user: ", currentUser.id);

    const role = await ProjectRoleModel.findOne({
      project: project._id,
      employee: employee._id,
    }).populate("employee role");

    if (!role) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "projectRoleValidationMessages.response.getUserRoleDetails.roleNotAvailable"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectRoleValidationMessages.response.getUserRoleInIncident.success"
      ),
      data: role,
    });
  } catch (error) {
    return res.status(5000).json({
      success: false,
      error: req.i18n.t(
        "projectRoleValidationMessages.response.getUserRoleInIncident.server"
      ),
    });
  }
};
