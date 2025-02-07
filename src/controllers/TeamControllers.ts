import { Request, Response } from "express";
import TeamModel from "../models/TeamModel";
import EmployeeModel from "../models/EmployeeModel";
import mongoose from "mongoose";
import { getPaginationOptions, paginate } from "../helper/pagination";
import { ICustomRequest } from "../types/express";

// Create a new Team
export const createTeam = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { name } = req.body;
    const isExist = await TeamModel.findOne({
      name,
      createdBy: currentUser.id,
    });

    if (isExist) {
      return res.status(403).json({
        success: false,
        error: req.i18n.t("teamValidationMessages.response.createTeam.exist"),
      });
    }

    const newTeam = new TeamModel({ name, createdBy: currentUser.id });
    const savedTeam = await newTeam.save();

    return res.status(201).json({
      success: true,
      message: req.i18n.t("teamValidationMessages.response.createTeam.success"),
      data: savedTeam,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t("teamValidationMessages.response.createTeam.server"),
    });
  }
};

// Get all Teams
export const getAllTeams = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const populateOptions = [
      {
        path: "members",
        model: "Employee",
        select: "name email designation contactNo",
      },
    ];

    const options = getPaginationOptions(req, {
      populate: populateOptions,
      sort: { createdAt: -1 },
      filter: {
        isDeleted: false,
        // createdBy: currentUser.id,
      },
    });
    const result = await paginate(TeamModel, options);
    return res.status(200).json({
      success: true,
      ...result,
      message: req.i18n.t(
        "teamValidationMessages.response.getAllTeams.success"
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t("teamValidationMessages.response.getAllTeams.server"),
    });
  }
};

// Add new member to team
export const addNewMemberToTeam = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employeeId }: { employeeId: [] } = req.body;

  try {
    const team = await TeamModel.findById(id).populate("members");
    if (!team) {
      return res.status(404).json({
        success: false,
        error: req.i18n.t(
          "teamValidationMessages.response.addMemberToTeam.notFound"
        ),
      });
    }

    const employeeMongoIds = await Promise.all(
      employeeId.map(async (item) => {
        const employee = await EmployeeModel.findById(item);
        if (!employee) {
          throw new Error(
            `${req.i18n.t(
              "teamValidationMessages.response.addMemberToTeam.notFoundEmployee"
            )}`
          );
        }
        const isAlreadyExist = team.members.some((member) =>
          member._id.equals(item)
        );
        if (isAlreadyExist) {
          throw new Error(
            `${req.i18n.t(
              "teamValidationMessages.response.addMemberToTeam.alreadyinTeam"
            )}`
          );
        }
        return new mongoose.Types.ObjectId(item);
      })
    );

    team.members.push(...employeeMongoIds);
    await team.save();

    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "teamValidationMessages.response.addMemberToTeam.success"
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// remove member from team
export const removeMemberFromTeam = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employeeId } = req.body;
  try {
    const team = await TeamModel.findById(id).populate("members");
    if (!team) {
      return res.status(404).json({
        success: false,
        error: req.i18n.t(
          "teamValidationMessages.response.removeMemberFromTeam.notFound"
        ),
      });
    }

    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: req.i18n.t(
          "teamValidationMessages.response.removeMemberFromTeam.notFoundEmployee"
        ),
      });
    }

    const isExist = team.members.some((member) =>
      member._id.equals(employeeId)
    );

    if (!isExist) {
      return res.status(400).json({
        success: false,
        error: req.i18n.t(
          "teamValidationMessages.response.removeMemberFromTeam.alreadyNotinTeam"
        ),
      });
    }

    team.members = team.members.filter(
      (member) => !member._id.equals(employeeId)
    );
    await team.save();

    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "teamValidationMessages.response.removeMemberFromTeam.success"
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "teamValidationMessages.response.removeMemberFromTeam.server"
      ),
    });
  }
};

// Get details of team
export const getTeamDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const team = await TeamModel.findById(id).populate("members");
    if (!team) {
      return res.status(404).json({
        success: false,
        message: req.i18n.t(
          "teamValidationMessages.response.getTeamById.notFound"
        ),
      });
    }
    return res.status(200).json({
      success: true,
      data: team,
      message: req.i18n.t(
        "teamValidationMessages.response.getTeamById.success"
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t("teamValidationMessages.response.getTeamById.server"),
    });
  }
};

// Update details of team
export const updateTeamDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const team = await TeamModel.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );
    if (!team) {
      return res.status(404).json({
        success: false,
        message: req.i18n.t(
          "teamValidationMessages.response.updateTeamById.notFound"
        ),
      });
    }
    return res.status(200).json({
      success: true,
      data: team,
      message: req.i18n.t(
        "teamValidationMessages.response.updateTeamById.success"
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "teamValidationMessages.response.updateTeamById.server"
      ),
    });
  }
};

// Get team names
export const getTeamNames = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const teams = await TeamModel.find({
      // createdBy: currentUser.id,
      isDeleted: false,
    }).select("name");

    if (!teams.length) {
      return res
        .status(404)
        .json({
          success: false,
          message: req.i18n.t(
            "teamValidationMessages.response.getTeamNames.notFound"
          ),
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        data: teams,
        message: req.i18n.t(
          "teamValidationMessages.response.getTeamNames.success"
        ),
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        error: req.i18n.t(
          "teamValidationMessages.response.getTeamNames.server"
        ),
      });
  }
};

// get team employees data
export const getTeamEmployees = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const team = await TeamModel.findById(id).populate(
      "members",
      "name contactNo designation email"
    );

    if (!team) {
      return res
        .status(404)
        .json({
          success: false,
          message: req.i18n.t(
            "teamValidationMessages.response.getTeamEmployees.notFound"
          ),
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        employees: team.members,
        message: req.i18n.t(
          "teamValidationMessages.response.getTeamEmployees.success"
        ),
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        error: req.i18n.t(
          "teamValidationMessages.response.getTeamEmployees.server"
        ),
      });
  }
};
