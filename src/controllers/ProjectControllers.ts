import { Request, Response } from "express";
import ProjectModel from "../models/ProjectModel";
import mongoose from "mongoose";
import { getPaginationOptions, paginate } from "../helper/pagination";
import LocationModel from "../models/LocationModel";
import CountryModel from "../models/CountryModel";
import RegionModel from "../models/RegionModel";
import WorksiteModel from "../models/WorksiteModel";
import { generateUniqueId } from "../helper/ProjectFunctions";
import { ICustomRequest } from "../types/express";
import ProjectRoleModel from "../models/ProjectRoleModel";
import { GlobalAdminRoles } from "../config/global-enum";
import EmployeeModel from "../models/EmployeeModel";
import RoleModel, { IRole } from "../models/RoleModel";
import UserModel from "../models/UserModel";

// Create a project only by getting name
export const createProjectByName = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const isExist = await ProjectModel.findOne({ name });
    if (isExist) {
      return res.status(400).json({
        success: false,
        error: req.i18n.t(
          "projectValidationMessages.response.createProjectByName.exist"
        ),
      });
    }

    const newProject = await ProjectModel.create({
      name,
      description,
    });

    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "projectValidationMessages.response.createProjectByName.success"
      ),
      project: newProject,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "projectValidationMessages.response.createProjectByName.server"
      ),
    });
  }
};

// create a new project
export const createProject = async (req: Request, res: Response) => {
  let session;
  try {
    session = await mongoose.startSession();
    let populatedProjectOriginal;
    await session.withTransaction(async (session) => {
      const customReq = req as ICustomRequest;
      const currentUser = customReq.user;

      const { parentProjectId, name, description, country, region, worksite } =
        req.body;

      let parentProject;

      // Validation checks without manual transaction handling
      if (!parentProjectId && !name) {
        throw new Error(
          "Please Provide atleast one one of them Parent Project or New Project Name."
        );
      }

      if (!parentProjectId && !description) {
        throw new Error(
          "Please Provide atleast one one of them Parent Project or New Project Description."
        );
      }

      if (parentProjectId) {
        parentProject = await ProjectModel.findById(parentProjectId).session(
          session
        );

        if (!parentProject) {
          throw new Error(
            `${req.i18n.t(
              "projectValidationMessages.response.createProject.parentProject"
            )} ${parentProjectId}.`
          );
        }
      }

      const [isCountryExist, isRegionExist, isWorksiteExist] =
        await Promise.all([
          CountryModel.exists({ _id: country }).session(session),
          RegionModel.exists({ _id: region }).session(session),
          WorksiteModel.exists({ _id: worksite }).session(session),
        ]);

      if (!isCountryExist || !isRegionExist || !isWorksiteExist) {
        throw new Error(
          `${
            !isCountryExist
              ? `Country: ${country}`
              : !isRegionExist
              ? `Region: ${region}`
              : `Worksite ${worksite}`
          } ${req.i18n.t(
            "projectValidationMessages.response.createProject.invalidLocation"
          )}`
        );
      }

      let projectLocation = await LocationModel.findOne({
        country,
        region,
        worksite,
      }).session(session);

      if (!projectLocation) {
        [projectLocation] = await LocationModel.create(
          [
            {
              country,
              region,
              worksite,
            },
          ],
          { session }
        );
      }

      const id = await generateUniqueId();

      const projectData = {
        id,
        name: parentProject ? parentProject.name : name?.trim(),
        description: description
          ? description.trim()
          : parentProject?.description,
        location: projectLocation?._id,
        parentProjectId: parentProjectId || null,
        createdBy: currentUser.id,
      };

      const [newProject] = await ProjectModel.create([projectData], {
        session,
      });

      let ownerRole: IRole | null = await RoleModel.findOne({
        title: "Owner",
      }).session(session);

      if (!ownerRole) {
        [ownerRole] = await RoleModel.create(
          [
            {
              title: "Owner",
              description: "Owner Of The Project",
              createdBy: currentUser.id,
            },
          ],
          { session }
        );
      }

      let employee = await EmployeeModel.findOne({
        user: currentUser.id,
      }).session(session);

      if (!employee) {
        const user = await UserModel.findById(currentUser.id).session(session);

        [employee] = await EmployeeModel.create(
          [
            {
              name: "Owner",
              contactNo: user?.phoneNumber || "",
              designation: "Owner",
              email: user?.email || "",
              user: currentUser.id,
              createdBy: currentUser.id,
            },
          ],
          { session }
        );
      }

      const projectRoleData = {
        project: newProject._id,
        priority: 1,
        role: ownerRole._id,
        employee: employee._id,
        description: "Owner of the project",
        createdBy: currentUser.id,
      };

      await ProjectRoleModel.create([projectRoleData], { session });

      const populatedProject = await ProjectModel.findById(newProject._id)
        .populate({
          path: "location",
          select: "country region worksite",
          populate: [
            { path: "country", select: "name" },
            { path: "region", select: "name" },
            { path: "worksite", select: "name" },
          ],
        })
        .session(session);

      populatedProjectOriginal = populatedProject;
    });

    // If we reach here, the transaction was successfull
    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "projectValidationMessages.response.createProject.success"
      ),
      project: populatedProjectOriginal,
    });
  } catch (error: any) {
    console.error("Error in create project: ", error.message);

    const statusCode = error.message.includes("Please Provide") ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      error:
        error.message ||
        req.i18n.t("projectValidationMessages.response.createProject.server"),
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// Get all projects
export const getAllProjects = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  const role = currentUser.role;
  try {
    let result;
    const { search } = req.query;
    const projectPopulateOptions = [
      {
        path: "parentProjectId",
        model: "Project",
        select: "name",
      },
      {
        path: "location",
        model: "Location",
        populate: {
          path: "country region worksite",
          select: "name",
        },
      },
    ];

    if (role === GlobalAdminRoles.SuperAdmin) {
      let options = getPaginationOptions(req, {
        populate: projectPopulateOptions,
        sort: { createdAt: -1 },
        filter: {
          createdBy: new mongoose.Types.ObjectId(currentUser.id),
        },
      });

      if (search) {
        options = getPaginationOptions(req, {
          populate: projectPopulateOptions,
          sort: { createdAt: -1 },
          filter: {
            createdBy: new mongoose.Types.ObjectId(currentUser.id),
            isDeleted: false,
            $or: [
              { name: { $regex: search, $options: "i" } },
              { id: { $regex: search, $options: "i" } },
            ],
          },
        });
      }
      result = await paginate(ProjectModel, options);
    } else if (role === GlobalAdminRoles.ClientAdmin) {
      const employee = await EmployeeModel.findOne({
        user: new mongoose.Types.ObjectId(currentUser.id),
      });

      const roles = await ProjectRoleModel.find({
        employee: employee?._id,
      }).select("project");

      const projectIds = roles.map((role) => role.project);

      let options = getPaginationOptions(req, {
        populate: projectPopulateOptions,
        sort: { createdAt: -1 },
        filter: {
          $or: [{ _id: { $in: projectIds } }, { createdBy: currentUser.id }],
          isDeleted: false,
        },
      });

      if (search) {
        options = getPaginationOptions(req, {
          populate: projectPopulateOptions,
          sort: { createdAt: -1 },
          filter: {
            _id: { $in: projectIds },
            isDeleted: false,
            $or: [
              { name: { $regex: search, $options: "i" } },
              { id: { $regex: search, $options: "i" } },
            ],
          },
        });
      }

      result = await paginate(ProjectModel, options);
    }

    return res.status(200).json({
      success: true,
      ...result,
      message: req.i18n.t(
        "projectValidationMessages.response.getAllProjects.success"
      ),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "projectValidationMessages.response.getAllProjects.server"
      ),
    });
  }
};

// Get all projects
export const getAllProjectsForUser = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const projects = await ProjectModel.find({
      createdBy:currentUser.id
    })

    return res.status(200).json({
      success: true,
      data:projects,
      message: req.i18n.t(
        "projectValidationMessages.response.getAllProjects.success"
      ),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "projectValidationMessages.response.getAllProjects.server"
      ),
    });
  }
};

// Get a project by Id
// export const getProjectById = async (req: Request, res: Response) => {
//   const { id } = req.params;

//   const projectPipeline = [
//     {
//       $match: {
//         isDeleted: false,
//         _id: new mongoose.Types.ObjectId(id),
//       },
//     },
//     {
//       $unwind: "$roles",
//     },
//     {
//       $lookup: {
//         from: "teams",
//         localField: "roles.team",
//         foreignField: "_id",
//         as: "teamData",
//       },
//     },
//     {
//       $lookup: {
//         from: "employees",
//         localField: "roles.assignTo",
//         foreignField: "_id",
//         as: "employeeData",
//       },
//     },
//     {
//       $unwind: {
//         path: "$teamData",
//         preserveNullAndEmptyArrays: true,
//       },
//     },
//     {
//       $unwind: {
//         path: "$employeeData",
//         preserveNullAndEmptyArrays: true,
//       },
//     },
//     {
//       $group: {
//         _id: "$roles.team",
//         team: { $first: "$teamData" }, // Populate team details
//         employees: { $addToSet: "$employeeData" }, // Populate employees list
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         team: 1,
//         employees: 1,
//       },
//     },
//   ];

//   try {
//     const result = await ProjectModel.aggregate(projectPipeline);
//     const project = await ProjectModel.findById(id).populate({
//       path: "location",
//       populate: [
//         {
//           path: "country",
//         },
//         {
//           path: "region",
//         },
//         {
//           path: "worksite",
//         },
//       ],
//     });

//     const data = {
//       name: project?.name,
//       id: project?.id,
//       description: project?.description,
//       parentProject: project?.parentProjectId,
//       location: project?.location,
//       roles: result,
//     };

//     return res.status(200).json({
//       success: true,
//       data: data,
//     });
//   } catch (error) {
//     console.error("Error in aggregation:", error);
//     throw error;
//   }
// };

export const getProjectById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Check if project exists
    const project = await ProjectModel.findOne({
      _id: id,
      isDeleted: false,
    }).populate({
      path: "location",
      populate: [{ path: "country" }, { path: "region" }, { path: "worksite" }],
    });

    if (!project) {
      return res.status(200).json({
        success: false,
        error: "Project not found.",
      });
    }

    const rolesPipeline = [
      {
        $match: {
          project: new mongoose.Types.ObjectId(id),
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

    const roles = await ProjectRoleModel.aggregate(rolesPipeline);

    // Construct response
    const data = {
      id: project.id,
      name: project.name,
      description: project.description,
      parentProject: project.parentProjectId,
      location: project.location,
      roles: roles,
    };

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error in fetching project:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

// Update a project by ID
export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, location, parentProjectId } = req.body;
  try {
    if (parentProjectId) {
      const isParentProjectExist = await ProjectModel.findById(parentProjectId);
      if (!isParentProjectExist) {
        throw new Error(
          `${req.i18n.t(
            "projectValidationMessages.response.updateProject.parentProject"
          )} ${parentProjectId}.`
        );
      }
    }

    if (location) {
      const isLocationExist = await LocationModel.exists({ _id: location });
      if (!isLocationExist) {
        return res.status(200).json({
          success: false,
          error: `${req.i18n.t(
            "projectValidationMessages.response.updateProject.locationNotExist"
          )} ${location}.`,
        });
      }
    }

    const updatedProject = await ProjectModel.findByIdAndUpdate(
      id,
      { name, description, location, parentProjectId },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "projectValidationMessages.response.updateProject.notFound"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectValidationMessages.response.updateProject.success"
      ),
      project: updatedProject,
    });
  } catch (error: any) {
    console.error("Error in update project: ", error.message);
    return res.status(500).json({
      success: false,
      error:
        error.message ||
        req.i18n.t("projectValidationMessages.response.updateProject.server"),
    });
  }
};

// Delete a project by ID
export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const project = await ProjectModel.findByIdAndUpdate(id, {
      $set: {
        isDeleted: true,
      },
    });

    if (!project) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "projectValidationMessages.response.deleteProjectById.notFound"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectValidationMessages.response.deleteProjectById.success"
      ),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "projectValidationMessages.response.deleteProjectById.server"
      ),
    });
  }
};

// Add roles to project
// export const addRolesInProject = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { roles } = req.body;
//   try {
//     const project = await ProjectModel.findById(id);
//     if (!project) {
//       return res.status(400).json({
//         success: false,
//         error: req.i18n.t("projectValidationMessages.response.notExist"),
//       });
//     }

//     if (!Array.isArray(roles) || roles.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: "Roles array cannot be empty.",
//       });
//     }

//     const roleValidationPromises = roles.map(
//       async (role: {
//         team: mongoose.Types.ObjectId;
//         assignTo: mongoose.Types.ObjectId;
//         roleDescription: string;
//       }) => {
//         if (!role.team) {
//           throw new Error(req.i18n.t("teamValidationMessages.id.empty"));
//         }

//         if (!role.assignTo) {
//           throw new Error(req.i18n.t("employeeValidationMessages.id.empty"));
//         }

//         if (!mongoose.isValidObjectId(role.team)) {
//           throw new Error(
//             req.i18n.t("teamValidationMessages.id.invalidMongooseFormat")
//           );
//         }
//         if (!mongoose.isValidObjectId(role.assignTo)) {
//           throw new Error(
//             req.i18n.t("employeeValidationMessages.id.invalidMongooseFormat")
//           );
//         }

//         const teamId = new mongoose.Types.ObjectId(role.team);
//         const employeeId = new mongoose.Types.ObjectId(role.assignTo);

//         const teamExists = await TeamModel.findOne({ _id: teamId });
//         if (!teamExists) {
//           throw new Error(
//             `${req.i18n.t("teamValidationMessages.response.teamNotExist")} ${
//               role.team
//             }.`
//           );
//         }

//         const employeeExists = await EmployeeModel.exists({
//           _id: employeeId,
//         });
//         if (!employeeExists) {
//           throw new Error(
//             `${req.i18n.t("employeeValidationMessages.response.notExist")} ${
//               role.assignTo
//             }.`
//           );
//         }

//         const isEmployeePartOfTeam = teamExists.members.includes(role.assignTo);
//         if (!isEmployeePartOfTeam) {
//           throw new Error(
//             `${req.i18n.t(
//               "teamValidationMessages.response.removeMemberFromTeam.alreadyNotinTeam"
//             )} ${role.assignTo}.`
//           );
//         }
//         return {
//           team: teamId,
//           assignTo: employeeId,
//           roleDescription: role.roleDescription,
//         };
//       }
//     );

//     let resolveRoles = await Promise.all(roleValidationPromises);

//     await ProjectModel.findByIdAndUpdate(
//       id,
//       { $push: { roles: { $each: resolveRoles } } },
//       { new: true }
//     );

//     await project.save();

//     return res.status(200).json({
//       success: true,
//       message: req.i18n.t(
//         "projectValidationMessages.response.addRolesInProject.success"
//       ),
//     });
//   } catch (error: any) {
//     console.error("Error ind adding roles in project:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// // update role details
// export const updateSpecificRole = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { roleId, newRoleDetails } = req.body;

//   try {
//     const project = await ProjectModel.findById(id);
//     if (!project) {
//       return res.status(200).json({
//         success: false,
//         message: req.i18n.t(
//           "projectValidationMessages.response.updateSpecificRole.notFound"
//         ),
//       });
//     }

//     const roleIndex = project.roles.findIndex((role) =>
//       (role._id as mongoose.Types.ObjectId).equals(
//         new mongoose.Types.ObjectId(roleId)
//       )
//     );

//     if (roleIndex === -1) {
//       return res.status(200).json({
//         success: false,
//         message: req.i18n.t(
//           "projectValidationMessages.response.updateSpecificRole.roleNotAvailabel"
//         ),
//       });
//     }

//     const { team, assignTo, roleDescription } = newRoleDetails;

//     let teamDetails: ITeam | null = null;
//     if (team) {
//       teamDetails = await TeamModel.findById(team);
//       if (!teamDetails) {
//         return res.status(200).json({
//           success: false,
//           error: `${req.i18n.t(
//             "projectValidationMessages.response.updateSpecificRole.teamNotFound"
//           )} ${team}`,
//         });
//       }
//       project.roles[roleIndex].team = new mongoose.Types.ObjectId(team);
//     }

//     if (assignTo) {
//       const isEmployeeExist = await EmployeeModel.findById(assignTo);
//       if (!isEmployeeExist) {
//         return res.status(200).json({
//           success: false,
//           error: `${req.i18n.t(
//             "projectValidationMessages.response.updateSpecificRole.employeeNotFound"
//           )} ${assignTo}`,
//         });
//       }
//       project.roles[roleIndex].assignTo = new mongoose.Types.ObjectId(assignTo);
//     }

//     if (team && assignTo && teamDetails) {
//       const isEmployeeExistInTeam = teamDetails.members.includes(assignTo);
//       if (!isEmployeeExistInTeam) {
//         return res.status(200).json({
//           success: false,
//           error: req.i18n.t(
//             "teamValidationMessages.response.removeMemberFromTeam.alreadyNotinTeam"
//           ),
//         });
//       }
//     }

//     if (roleDescription)
//       project.roles[roleIndex].roleDescription = roleDescription;

//     await project.save();

//     return res.status(200).json({
//       success: true,
//       message: req.i18n.t(
//         "projectValidationMessages.response.updateSpecificRole.success"
//       ),
//       data: project.roles[roleIndex],
//     });
//   } catch (error) {
//     console.error("Error updating specific role:", error);
//     return res.status(500).json({
//       success: false,
//       message: req.i18n.t(
//         "projectValidationMessages.response.updateSpecificRole.server"
//       ),
//     });
//   }
// };

export const getProjectsByLocation = async (req: Request, res: Response) => {
  try {
    const { country, region, worksite } = req.query;

    const location = await LocationModel.findOne({
      country,
      region,
      worksite,
    });

    if (!location) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "projectValidationMessages.response.getProjectsByLocation.locationNotExist"
        ),
      });
    }

    if (!mongoose.Types.ObjectId.isValid(location._id)) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t(
          "locationValidationMessages.validateLocationId.invalidId"
        ),
      });
    }

    const projects = await ProjectModel.find({
      location: new mongoose.Types.ObjectId(location._id),
      isDeleted: false,
    }).populate({
      path: "location",
      select: "country region worksite",
      populate: [
        { path: "country", select: "name" },
        { path: "region", select: "name" },
        { path: "worksite", select: "name" },
      ],
    });

    if (!projects.length) {
      return res.status(200).json({
        success: false,
        message: `${req.i18n.t(
          "projectValidationMessages.response.getProjectsByLocation.notFound"
        )} ${location._id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectValidationMessages.response.getProjectsByLocation.success"
      ),
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects by location:", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "projectValidationMessages.response.getProjectsByLocation.server"
      ),
    });
  }
};

export const getAllEmployeesInProjectOrganization = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { priority } = req.query;

    const matchCondition: any = {
      project: new mongoose.Types.ObjectId(id),
      // isDeleted:false,
    };

    if (priority === "true") {
      matchCondition.priority = { $exists: true, $ne: null };
    } else if (priority === "false") {
      matchCondition.priority = { $exists: false };
    }

    // console.log(matchCondition)

    const roles = await ProjectRoleModel.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $unwind: {
          path: "$employeeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: null,
          employees: { $push: "$employeeDetails" },
        },
      },
      {
        $project: {
          _id: 0,
          employees: 1,
        },
      },
    ]);

    if (!roles.length) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "projectValidationMessages.response.getAllEmployeesInProjectOrganization.notFound"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectValidationMessages.response.getAllEmployeesInProjectOrganization.success"
      ),
      data: roles,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      error: req.i18n.t(
        "projectValidationMessages.response.getAllEmployeesInProjectOrganization.server"
      ),
    });
  }
};
