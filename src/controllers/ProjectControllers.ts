import { Request, Response } from "express";
import ProjectModel, { IProjectRoles } from "../models/ProjectModel";
import RoleModel from "../models/RoleModel";
import EmployeeModel from "../models/EmployeeModel";
import mongoose from "mongoose";
import { getPaginationOptions, paginate } from "../helper/pagination";
import LocationModel from "../models/LocationModel";
import CountryModel from "../models/CountryModel";
import RegionModel from "../models/RegionModel";
import WorksiteModel from "../models/WorksiteModel";
import { generateUniqueId } from "../helper/ProjectFunctions";
import { ICustomRequest } from "../types/express";
import TeamModel from "../models/TeamModel";
import {ITeam} from "../models/TeamModel";


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
  const session = await mongoose.startSession();
  session.startTransaction();
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const {
      parentProjectId,
      name,
      description,
      // roles,
      country,
      region,
      worksite,
    } = req.body;

    let parentProject;

    if (!parentProjectId && !name) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error:
          "Please Provide atleast one one of them Parent Project or New Project Name.",
      });
    }

    if (!parentProjectId && !description) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error:
          "Please Provide atleast one one of them Parent Project or New Project Description.",
      });
    }

    if (parentProjectId) {
      parentProject = await ProjectModel.findById(parentProjectId).session(
        session
      );

      if (parentProjectId && !parentProject) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: `${req.i18n.t(
            "projectValidationMessages.response.createProject.parentProject"
          )} ${parentProjectId}.`,
        });
      }
    }

    // if (
    //   parentProject &&
    //   (!parentProject.country || !parentProject.roles.length)
    // ) {
    //   parentProject.country = country;
    //   parentProject.region = region;
    //   parentProject.worksite = worksite;
    //   parentProject.roles = roles;
    //   parentProject.parentProjectId=null;

    //   await parentProject.save();

    //   return res.status(200).json({
    //     success: true,
    //     message: req.i18n.t("projectValidationMessages.response.createProject.update"),
    //     project: parentProject,
    //   });
    // }

    const locationValidations = await Promise.all([
      CountryModel.exists({ _id: country }).session(session),
      RegionModel.exists({ _id: region }).session(session),
      WorksiteModel.exists({ _id: worksite }).session(session),
    ]);

    const [isCountryExist, isRegionExist, isWorksiteExist] =
      locationValidations;

    if (!isCountryExist || !isRegionExist || !isWorksiteExist) {
      // throw new Error(
      //   req.i18n.t(
      //     "projectValidationMessages.response.createProject.invalidLocation"
      //   )
      // );
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

    // Create new location if it doesn't exist
    if (!projectLocation) {
      projectLocation = await LocationModel.create(
        [
          {
            country,
            region,
            worksite,
          },
        ],
        { session }
      ).then((locations) => locations[0]);
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
      // roles:
      //   roles?.map((role: IProjectRoles) => ({
      //     role: role.role,
      //     assignTo: role.assignTo,
      //     roleDescription: role.roleDescription.trim(),
      //   })) || [],
    };

    const [newProject] = await ProjectModel.create([projectData], { session });

    const populatedProject = await ProjectModel.findById(newProject._id)
      .populate([
        { path: "location", select: "country region worksite" },
        // { path: "roles.role", select: "name description" },
        // { path: "roles.assignTo", select: "name email",model:"Employee" },
      ])
      .session(session);

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "projectValidationMessages.response.createProject.success"
      ),
      project: populatedProject,
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error in create project: ", error.message);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "projectValidationMessages.response.createProject.server"
      ),
    });
  } finally {
    await session.endSession();
  }
};

// Get all projects
export const getAllProjects = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const projectPopulateOptions = [
      {
        path: "roles",
        populate: [
          {
            path: "role",
            model: "Role",
            select: "name",
          },
          {
            path: "assignTo",
            model: "Employee",
            select: "name email",
          },
        ],
      },
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
          // model:"Country Region Worksite",
          select: "name",
        },
      },
    ];
    const options = getPaginationOptions(req, {
      populate: projectPopulateOptions,
      sort: { createdAt: -1 },
      filter: { createdBy: currentUser.id },
    });
    const result = await paginate(ProjectModel, options);

    return res.status(200).json({
      success: true,
      ...result,
      message: req.i18n.t(
        "projectValidationMessages.response.getAllProjects.success"
      ),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "projectValidationMessages.response.getAllProjects.server"
      ),
    });
  }
};

// Get a project by Id
export const getProjectById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const projectPipeline = [
    {
      $match: {
        isDeleted: false,
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $unwind: "$roles",
    },
    {
      $lookup: {
        from: "teams",
        localField: "roles.team",
        foreignField: "_id",
        as: "teamData",
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "roles.assignTo",
        foreignField: "_id",
        as: "employeeData",
      },
    },
    {
      $unwind: {
        path: "$teamData",
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
        _id: "$roles.team",
        team: { $first: "$teamData" }, // Populate team details
        employees: { $addToSet: "$employeeData" }, // Populate employees list
      },
    },
    {
      $project: {
        _id: 0,
        team: 1,
        employees: 1,
      },
    },
  ];

  try {
    const result = await ProjectModel.aggregate(projectPipeline);
    const project = await ProjectModel.findById(id).populate({
      path: "location",
      populate: [
        {
          path: "country",
        },
        {
          path: "region",
        },
        {
          path: "worksite",
        },
      ],
    });

    const data = {
      name: project?.name,
      description: project?.description,
      parentProject: project?.parentProjectId,
      location: project?.location,
      roles: result,
    };

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error in aggregation:", error);
    throw error;
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
        return res.status(404).json({
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
      return res.status(404).json({
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
      return res.status(404).json({
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
export const addRolesInProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { roles } = req.body;
  try {
    const project = await ProjectModel.findById(id);
    if (!project) {
      return res.status(400).json({
        success: false,
        error: req.i18n.t("projectValidationMessages.response.notExist"),
      });
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Roles array cannot be empty.",
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
          assignTo: employeeId,
          roleDescription: role.roleDescription,
        };
      }
    );

    let resolveRoles = await Promise.all(roleValidationPromises);

    await ProjectModel.findByIdAndUpdate(
      id,
      { $push: { roles: { $each: resolveRoles } } },
      { new: true }
    );

    await project.save();

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectValidationMessages.response.addRolesInProject.success"
      ),
    });
  } catch (error: any) {
    console.error("Error ind adding roles in project:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
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
      return res.status(404).json({
        success: false,
        message: req.i18n.t(
          "projectValidationMessages.response.updateSpecificRole.notFound"
        ),
      });
    }

    const roleIndex = project.roles.findIndex((role) =>
      (role._id as mongoose.Types.ObjectId).equals(
        new mongoose.Types.ObjectId(roleId)
      )
    );

    if (roleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: req.i18n.t(
          "projectValidationMessages.response.updateSpecificRole.roleNotAvailabel"
        ),
      });
    }

    const { team, assignTo, roleDescription } = newRoleDetails;

    let teamDetails:ITeam|null=null;
    if (team) {
       teamDetails = await TeamModel.findById(team);
      if (!teamDetails) {
        return res.status(404).json({
          success: false,
          error: `${req.i18n.t(
            "projectValidationMessages.response.updateSpecificRole.teamNotFound"
          )} ${team}`,
        });
      }
      project.roles[roleIndex].team = new mongoose.Types.ObjectId(team);
    }

    if (assignTo) {
      const isEmployeeExist = await EmployeeModel.findById(assignTo);
      if (!isEmployeeExist) {
        return res.status(404).json({
          success: false,
          error: `${req.i18n.t(
            "projectValidationMessages.response.updateSpecificRole.employeeNotFound"
          )} ${assignTo}`,
        });
      }
      project.roles[roleIndex].assignTo = new mongoose.Types.ObjectId(assignTo);
    }

    if(team && assignTo && teamDetails){
      const isEmployeeExistInTeam = teamDetails.members.includes(assignTo);
      if(!isEmployeeExistInTeam){
        return res.status(404).json({
          success:false,
          error:req.i18n.t("teamValidationMessages.response.removeMemberFromTeam.alreadyNotinTeam")
        })
      }
    }


    if (roleDescription)
      project.roles[roleIndex].roleDescription = roleDescription;

    await project.save();

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "projectValidationMessages.response.updateSpecificRole.success"
      ),
      data: project.roles[roleIndex],
    });
  } catch (error) {
    console.error("Error updating specific role:", error);
    return res.status(500).json({
      success: false,
      message: req.i18n.t(
        "projectValidationMessages.response.updateSpecificRole.server"
      ),
    });
  }
};

export const getProjectsByLocation = async (req: Request, res: Response) => {
  try {
    const { country,region,worksite } = req.body;
  
    const location = await LocationModel.findOne({
      country,region,worksite
    })
    
    if(!location){
      return res.status(404).json({
        success:false,
        error:req.i18n.t("projectValidationMessages.response.getProjectsByLocation.locationNotExist")
      })
    }

    if (!mongoose.Types.ObjectId.isValid(location._id)) {
      return res.status(400).json({ 
        success:false,
        message: req.i18n.t("locationValidationMessages.validateLocationId.invalidId")
      });
    }

    const projects = await ProjectModel.find({
      location: new mongoose.Types.ObjectId(location._id),
      isDeleted: false,
    })
      .populate({
        path: "location",
        select: "country region worksite",
        populate: [
          { path: "country", select: "name" },
          { path: "region", select: "name" },
          { path: "worksite", select: "name" },
        ],
      })
      .populate({
        path: "roles.team",
        model: "Team",
        select: "name",
      })
      .populate({
        path: "roles.assignTo",
        model: "Employee",
        select: "name designation email",
      })

    if (!projects.length) {
      return res.status(404).json({ 
        success:false,
        message: `${req.i18n.t("projectValidationMessages.response.getProjectsByLocation.notFound")} ${location._id}`
      });
    }

    return res.status(200).json({ 
      success: true, 
      message:req.i18n.t("projectValidationMessages.response.getProjectsByLocation.success"),
      data:projects 
    });
  } catch (error) {
    console.error("Error fetching projects by location:", error);
    return res.status(500).json({ success:false,error: req.i18n.t("projectValidationMessages.response.getProjectsByLocation.server") });
  }
};

