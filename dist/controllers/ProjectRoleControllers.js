"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableRolesInProject = exports.getUserRoleInIncident = exports.getRolesByIncidentId = exports.getUserRoleDetails = exports.getProjectRolesByPriority = exports.updateRolePriority = exports.updateSpecificRole = exports.addRolesInProject = void 0;
const ProjectModel_1 = __importDefault(require("../models/ProjectModel"));
const TeamModel_1 = __importDefault(require("../models/TeamModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const EmployeeModel_1 = __importDefault(require("../models/EmployeeModel"));
const ProjectRoleModel_1 = __importDefault(require("../models/ProjectRoleModel"));
const RoleModel_1 = __importDefault(require("../models/RoleModel"));
const IncidentModel_1 = __importDefault(require("../models/IncidentModel"));
const ConversationModel_1 = __importStar(require("../models/ConversationModel"));
const conversation_service_1 = __importDefault(require("../services/conversation.service"));
const ProjectRoleFunctions_1 = require("../helper/ProjectRoleFunctions");
// add roles in projects
const addRolesInProject = async (req, res) => {
    const { id } = req.params;
    const { roles } = req.body;
    try {
        const project = await ProjectModel_1.default.findById(id);
        if (!project) {
            return res.status(400).json({
                success: false,
                error: req.i18n.t("projectValidationMessages.response.notExist") + id,
            });
        }
        if (!Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({
                success: false,
                error: req.i18n.t("projectRoleValidationMessages.response.addRolesInProject.empty"),
            });
        }
        const roleValidationPromises = roles.map(async (role) => {
            if (!role.roleId) {
                throw new Error(req.i18n.t("roleValidationMessages.id.empty"));
            }
            if (!role.assignTo) {
                throw new Error(req.i18n.t("employeeValidationMessages.id.empty"));
            }
            if (!mongoose_1.default.isValidObjectId(role.roleId)) {
                throw new Error(req.i18n.t("roleValidationMessages.id.invalidId"));
            }
            if (!mongoose_1.default.isValidObjectId(role.assignTo)) {
                throw new Error(req.i18n.t("employeeValidationMessages.id.invalidMongooseFormat"));
            }
            const roleId = new mongoose_1.default.Types.ObjectId(role.roleId);
            const employeeId = new mongoose_1.default.Types.ObjectId(role.assignTo);
            const roleExists = await RoleModel_1.default.findOne({ _id: roleId });
            if (!roleExists) {
                throw new Error(`${req.i18n.t("roleValidationMessages.response.notFound")} ${role.roleId}.`);
            }
            const employeeExists = await EmployeeModel_1.default.findOne({
                _id: employeeId,
            });
            if (!employeeExists) {
                throw new Error(`${req.i18n.t("employeeValidationMessages.response.notExist")} ${role.assignTo}.`);
            }
            const teams = await TeamModel_1.default.find({ members: employeeId })
                .populate("members", "name")
                .exec();
            if (teams.length === 0) {
                throw new Error(`${req.i18n.t("teamValidationMessages.response.noTeamFoundForEmployee")} ${employeeExists.name}.`);
            }
            const teamId = new mongoose_1.default.Types.ObjectId(teams[0]._id.toString());
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
        });
        let resolveRoles = await Promise.all(roleValidationPromises);
        // await ProjectModel.findByIdAndUpdate(
        //   id,
        //   { $push: { roles: { $each: resolveRoles } } },
        //   { new: true }
        // );
        await ProjectRoleModel_1.default.insertMany(resolveRoles);
        const employeeIds = resolveRoles.map((role) => role.employee);
        const employees = await EmployeeModel_1.default.find({
            _id: { $in: employeeIds },
        });
        const userIds = employees.map((employee) => employee.user);
        const incidents = await IncidentModel_1.default.find({
            project: id,
        });
        if (incidents.length > 0) {
            const conversationPromises = incidents.map(async (incident) => {
                const conversation = await ConversationModel_1.default.findOne({
                    identity: ConversationModel_1.ConversationIdentity.INCIDENT,
                    identityId: incident._id,
                });
                if (!conversation) {
                    throw new Error(`${req.i18n.t("conversationValidationMessages.response.notFound")} ${incident._id}.`);
                }
                await Promise.all(userIds.map(async (userId) => {
                    await conversation_service_1.default.addParticipant(conversation._id.toString(), userId.toString(), userId.toString());
                }));
            });
            await Promise.all(conversationPromises);
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("projectRoleValidationMessages.response.addRolesInProject.success"),
        });
    }
    catch (error) {
        console.error("Error ind adding roles in project:", error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: req.i18n.t("projectRoleValidationMessages.response.addRolesInProject.server"),
        });
    }
};
exports.addRolesInProject = addRolesInProject;
// update role details
const updateSpecificRole = async (req, res) => {
    const { id } = req.params;
    const { roleId, newRoleDetails } = req.body;
    try {
        const project = await ProjectModel_1.default.findById(id);
        if (!project) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("projectRoleValidationMessages.response.updateSpecificRole.notFound"),
            });
        }
        const role = await ProjectRoleModel_1.default.findOne({ _id: roleId, project: id });
        if (!role) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("projectRoleValidationMessages.response.updateSpecificRole.roleNotAvailable"),
            });
        }
        const { role: newRoleId, employee, description } = newRoleDetails;
        if (newRoleId) {
            const roleDetails = await RoleModel_1.default.findById(newRoleId);
            if (!roleDetails) {
                return res.status(200).json({
                    success: false,
                    error: `${req.i18n.t("projectRoleValidationMessages.response.updateSpecificRole.roleNotFound")} ${newRoleId}`,
                });
            }
            role.role = new mongoose_1.default.Types.ObjectId(newRoleId);
        }
        if (employee) {
            const employeeExists = await EmployeeModel_1.default.findById(employee);
            if (!employeeExists) {
                return res.status(200).json({
                    success: false,
                    error: `${req.i18n.t("projectRoleValidationMessages.response.updateSpecificRole.employeeNotFound")} ${employee}`,
                });
            }
            role.employee = new mongoose_1.default.Types.ObjectId(employee);
            const teams = await TeamModel_1.default.find({ members: employee })
                .populate("members", "name")
                .exec();
            if (teams.length === 0) {
                throw new Error(`${req.i18n.t("teamValidationMessages.response.noTeamFoundForEmployee")} ${role.employee}.`);
            }
            const teamId = new mongoose_1.default.Types.ObjectId(teams[0]._id.toString());
            role.team = teamId;
        }
        if (description) {
            role.description = description;
        }
        await role.save();
        return res.status(200).json({
            success: true,
            message: req.i18n.t("projectRoleValidationMessages.response.updateSpecificRole.success"),
            data: role,
        });
    }
    catch (error) {
        console.error("Error updating specific role:", error);
        return res.status(500).json({
            success: false,
            message: req.i18n.t("projectRoleValidationMessages.response.updateSpecificRole.server"),
        });
    }
};
exports.updateSpecificRole = updateSpecificRole;
// add priority to given role
const updateRolePriority = async (req, res) => {
    try {
        const { from, to, role: roleId, employee } = req.body;
        const { id } = req.params;
        // Validate if the project exists
        const isProjectExist = await ProjectModel_1.default.findById(id);
        if (!isProjectExist) {
            return res.status(200).json({
                success: false,
                error: `${req.i18n.t("projectValidationMessages.response.notExist")} ${id}`,
            });
        }
        let role = await ProjectRoleModel_1.default.findOne({ project: id, employee });
        if (!role) {
            console.log("role id: ", roleId);
            if (roleId && roleId !== undefined) {
                const existingRole = await RoleModel_1.default.findById(roleId);
                if (!existingRole) {
                    return res.status(400).json({
                        success: false,
                        message: req.i18n.t("roleValidationMessages.response.notExist"),
                    });
                }
                const existingEmployee = await EmployeeModel_1.default.findById(employee);
                if (!existingEmployee) {
                    return res.status(400).json({
                        success: false,
                        message: req.i18n.t("employeeValidationMessages.response.notExist"),
                    });
                }
                const teams = await TeamModel_1.default.find({ members: employee })
                    .populate("members", "name")
                    .exec();
                if (teams.length === 0) {
                    throw new Error(`${req.i18n.t("teamValidationMessages.response.noTeamFoundForEmployee")} ${existingEmployee.name}.`);
                }
                const team = new mongoose_1.default.Types.ObjectId(teams[0]._id.toString());
                role = new ProjectRoleModel_1.default({
                    project: id,
                    team,
                    employee,
                    role: roleId,
                });
                await role.save();
                const incidents = await IncidentModel_1.default.find({
                    project: id,
                });
                if (incidents.length > 0) {
                    const conversationPromises = incidents.map(async (incident) => {
                        const conversation = await ConversationModel_1.default.findOne({
                            identity: ConversationModel_1.ConversationIdentity.INCIDENT,
                            identityId: incident._id,
                        });
                        if (!conversation) {
                            throw new Error(`${req.i18n.t("conversationValidationMessages.response.notFound")} ${incident._id}.`);
                        }
                        await conversation_service_1.default.addParticipant(conversation._id.toString(), existingEmployee.user.toString(), existingEmployee.user.toString());
                    });
                    await Promise.all(conversationPromises);
                }
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: "Please select role",
                });
            }
        }
        if (!role) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("projectRoleValidationMessages.response.updateRolePriority.notFound"),
            });
        }
        // Priority update logic
        if (!from && !to) {
            role.priority = 1;
            await role.save();
        }
        else if (from && !to) {
            const fromRole = await ProjectRoleModel_1.default.findOne({
                project: id,
                employee: from,
            });
            if (!fromRole) {
                return res.status(200).json({
                    success: false,
                    message: req.i18n.t("projectRoleValidationMessages.response.updateRolePriority.fromNotFound"),
                });
            }
            role.priority = fromRole.priority + 1;
            role.from = from;
            await role.save();
        }
        else if (!from && to) {
            const toRole = await ProjectRoleModel_1.default.findOne({
                project: id,
                employee: to,
            });
            if (!toRole) {
                return res.status(200).json({
                    success: false,
                    message: req.i18n.t("projectRoleValidationMessages.response.updateRolePriority.toNotFound"),
                });
            }
            role.priority = toRole.priority;
            role.from = toRole.from;
            role.to = to;
            await role.save();
            toRole.priority = to.priority + 1;
            toRole.from = role.employee;
            await toRole.save();
            await (0, ProjectRoleFunctions_1.updateDownstreamNodePriorities)(id, toRole.employee, toRole.priority);
        }
        else if (from && to) {
            const fromRole = await ProjectRoleModel_1.default.findOne({
                project: id,
                employee: from,
            });
            const toRole = await ProjectRoleModel_1.default.findOne({
                project: id,
                employee: to,
            });
            if (!fromRole || !toRole) {
                return res.status(200).json({
                    success: false,
                    message: req.i18n.t("projectRoleValidationMessages.response.updateRolePriority.toNotFound"),
                });
            }
            let sameNodeCheckFrom = toRole.from.toString() === from.toString();
            let newFromPriorityStatus = fromRole.priority + 1 === toRole.priority;
            let newToPriorityStatus = toRole.priority - 1 === fromRole.priority;
            if (!newFromPriorityStatus || !newToPriorityStatus || !sameNodeCheckFrom) {
                return res.status(400).json({
                    success: false,
                    error: req.i18n.t("projectRoleValidationMessages.response.updateRolePriority.conflict"),
                });
            }
            role.priority = fromRole.priority + 1;
            role.from = from;
            role.to = to;
            await role.save();
            toRole.priority = toRole.priority + 1;
            toRole.from = role.employee;
            await toRole.save();
            await (0, ProjectRoleFunctions_1.updateDownstreamNodePriorities)(id, toRole.employee, toRole.priority);
        }
        else {
            return res.status(400).json({
                success: false,
                message: req.i18n.t("projectRoleValidationMessages.response.updateRolePriority.invalid"),
            });
        }
        if (roleId) {
            role.role = new mongoose_1.default.Types.ObjectId(roleId);
        }
        await role.save();
        return res.status(200).json({
            success: true,
            message: req.i18n.t("projectRoleValidationMessages.response.updateRolePriority.success"),
            role,
        });
    }
    catch (error) {
        console.error("Error updating role priority:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : String(error)
            // message: req.i18n.t(
            //   "projectRoleValidationMessages.response.updateRolePriority.server"
            // ),
        });
    }
};
exports.updateRolePriority = updateRolePriority;
// get project roles according to priority
const getProjectRolesByPriority = async (req, res) => {
    const { id } = req.params;
    try {
        const projectId = new mongoose_1.default.Types.ObjectId(id);
        const isProjectExist = await ProjectModel_1.default.findById(projectId);
        if (!isProjectExist) {
            return res.status(200).json({
                success: false,
                error: `${req.i18n.t("projectValidationMessages.response.notExist")} ${id}`,
            });
        }
        // Fetch all roles for the given project with populated employee details
        const roles = await ProjectRoleModel_1.default.aggregate([
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
                error: req.i18n.t("projectRoleValidationMessages.response.getProjectRolesByPriority.notFound"),
            });
        }
        // console.log("roles: ", roles);
        // Organizing roles first by priority, then by 'from'
        const rolesByPriority = {};
        roles.forEach((role) => {
            const { priority, from } = role;
            if (!priority)
                return;
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
        // rolesByPriority.filter(()=>)
        return res.status(200).json({
            success: true,
            message: req.i18n.t("projectRoleValidationMessages.response.getProjectRolesByPriority.success"),
            data: rolesByPriority,
        });
    }
    catch (error) {
        console.error("Error fetching project roles by priority:", error);
        return res.status(500).json({
            success: false,
            error: req.i18n.t("projectRoleValidationMessages.response.getProjectRolesByPriority.server"),
        });
    }
};
exports.getProjectRolesByPriority = getProjectRolesByPriority;
// get user project role details by incident
const getUserRoleDetails = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    const { id } = req.params;
    try {
        const incident = await IncidentModel_1.default.findById(id);
        if (!incident) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("incidentValidationMessages.response.notFound"),
            });
        }
        const employee = await EmployeeModel_1.default.findOne({
            user: currentUser.id,
        });
        if (!employee) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("employeeValidationMessages.response.getEmployeeById.notFound"),
            });
        }
        const roleData = await ProjectRoleModel_1.default.findOne({
            project: incident.project,
            employee: employee._id,
        }).populate("employee role");
        if (!roleData) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("projectRoleValidationMessages.response.getUserRoleDetails.roleNotAvailable"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("projectRoleValidationMessages.response.getUserRoleDetails.success"),
            data: roleData,
        });
    }
    catch (error) {
        console.log("error in fetching role data: ", error);
        return res.status(200).json({
            success: false,
            error: req.i18n.t("projectRoleValidationMessages.response.getUserRoleDetails.server"),
        });
    }
};
exports.getUserRoleDetails = getUserRoleDetails;
// get roles by incident id
const getRolesByIncidentId = async (req, res) => {
    const { id } = req.params;
    const customReq = req;
    const currentUser = customReq.user;
    const currentUserId = currentUser.id;
    console.log("current User: ", currentUser);
    try {
        const incident = await IncidentModel_1.default.findById(id);
        if (!incident) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("incidentValidationMessages.response.notExist") + " " + id,
            });
        }
        const project = await ProjectModel_1.default.findById(incident.project);
        if (!project) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("projectValidationMessages.response.notExist") +
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
                            isCurrentUser: {
                                $eq: [
                                    "$employeeData.user",
                                    new mongoose_1.default.Types.ObjectId(currentUserId),
                                ],
                            },
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
        let roles = await ProjectRoleModel_1.default.aggregate(rolesPipeline);
        // Fetch conversations for each employee (except current user)
        roles = await Promise.all(roles.map(async (role) => {
            const employeesWithConversations = await Promise.all(role.employees.map(async (employee) => {
                // Skip if this is the current user's employee record
                // console.log("iscUrrent: ", employee);
                if (employee.isCurrentUser) {
                    const { isCurrentUser, ...employeeData } = employee;
                    return employeeData;
                }
                if (!employee.user)
                    return employee;
                // Find conversation where both current user and employee's user are participants
                const conversation = await ConversationModel_1.default.findOne({
                    type: ConversationModel_1.ConversationType.SINGLE,
                    participants: {
                        $all: [
                            { $elemMatch: { user: currentUserId } },
                            { $elemMatch: { user: employee.user } },
                        ],
                    },
                }).select("twilioSid name type identity");
                return {
                    ...employee,
                    conversation: conversation ?? null,
                    isCurrentUser: undefined, // Remove the flag from final output
                };
            }));
            return {
                ...role,
                employees: employeesWithConversations,
            };
        }));
        return res.status(200).json({
            success: true,
            message: req.i18n.t("projectRoleValidationMessages.response.getRolesByIncidentId.success"),
            data: roles,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: req.i18n.t("projectRoleValidationMessages.response.getRolesByIncidentId.server"),
        });
    }
};
exports.getRolesByIncidentId = getRolesByIncidentId;
const getUserRoleInIncident = async (req, res) => {
    const { id } = req.params;
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const incident = await IncidentModel_1.default.findById(id);
        if (!incident) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("incidentValidationMessages.response.notExist") + " " + id,
            });
        }
        // console.log("incident: ", incident);
        const project = await ProjectModel_1.default.findOne({ _id: incident.project });
        if (!project) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("projectValidationMessages.response.notExist") +
                    " " +
                    incident.project,
            });
        }
        const employee = await EmployeeModel_1.default.findOne({
            user: currentUser.id,
        });
        if (!employee) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("employeeValidationMessages.response.getEmployeeById.notFound"),
            });
        }
        // console.log("user: ", currentUser.id);
        const role = await ProjectRoleModel_1.default.findOne({
            project: project._id,
            employee: employee._id,
        }).populate("employee role");
        if (!role) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("projectRoleValidationMessages.response.getUserRoleDetails.roleNotAvailable"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("projectRoleValidationMessages.response.getUserRoleInIncident.success"),
            data: role,
        });
    }
    catch (error) {
        return res.status(5000).json({
            success: false,
            error: req.i18n.t("projectRoleValidationMessages.response.getUserRoleInIncident.server"),
        });
    }
};
exports.getUserRoleInIncident = getUserRoleInIncident;
const getAvailableRolesInProject = async (req, res) => {
    const { id } = req.params;
    const { priority } = req.query;
    try {
        const project = await ProjectModel_1.default.findById(id);
        if (!project) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("projectValidationMessages.response.notExist") +
                    " " +
                    id,
            });
        }
        const role = await ProjectRoleModel_1.default.find({
            project: project._id,
            priority: { $exists: priority },
            // employee: { $ne: currentUser.id },
        }).populate("employee role");
        if (!role) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("projectRoleValidationMessages.response.getUserRoleDetails.roleNotAvailable"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("projectRoleValidationMessages.response.getUserRoleInIncident.success"),
            data: role,
        });
    }
    catch (error) {
        return res.status(5000).json({
            success: false,
            error: req.i18n.t("projectRoleValidationMessages.response.getUserRoleInIncident.server"),
        });
    }
};
exports.getAvailableRolesInProject = getAvailableRolesInProject;
