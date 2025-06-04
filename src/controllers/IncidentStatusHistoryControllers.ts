import { Request, Response } from "express";
import IncidentStatusHistoryModel from "../models/IncidentStatusHistoryModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import mongoose from "mongoose";
import IncidentHistoryModel from "../models/IncidentHistoryModel";
import { ICustomRequest } from "../types/express";
import EmployeeModel from "../models/EmployeeModel";
import ProjectRoleModel from "../models/ProjectRoleModel";
import IncidentModel from "../models/IncidentModel";

export const getIncidentStatusHistory = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // let options = getPaginationOptions(req, {
    //   populate: [
    //     {
    //       path: "role",
    //       model: "Roles",
    //       populate: [
    //         {
    //           path: "employee",
    //           model: "Employee",
    //           select: "name designation",
    //         },
    //         {
    //           path: "team",
    //           model: "Team",
    //           select: "name",
    //         },
    //       ],
    //     },
    //   ],
    //   sort: { createdAt: -1 },
    //   filter: {
    //     incident: new mongoose.Types.ObjectId(id),
    //   },
    // });

    // const result = await paginate(IncidentStatusHistoryModel, options);

    const history = await IncidentStatusHistoryModel.aggregate([
      {
        $match: {
          incident: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "project_roles",
          localField: "role",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $unwind: "$role",
      },
      {
        $lookup: {
          from: "employees",
          localField: "role.employee",
          foreignField: "_id",
          as: "role.employee",
        },
      },
      {
        $unwind: "$role.employee",
      },
      {
        $lookup: {
          from: "roles",
          localField: "role.role",
          foreignField: "_id",
          as: "role.role",
        },
      },
      {
        $unwind: "$role.role",
      },
      {
        $lookup: {
          from: "teams",
          localField: "role.team",
          foreignField: "_id",
          as: "role.team",
        },
      },
      {
        $unwind: {
          path: "$role.team",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            $ifNull: ["$role.team.name", null],
          },
          data: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          team: "$_id",
          data: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: history,
      message: "Incident status history retrieved successfully",
    });
  } catch (error) {
    console.log("error: ", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error in retrieving incident status history",
    });
  }
};

export const getCurrentIncidentStatusHistoryByRole = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const employee = await EmployeeModel.findOne({
      user: currentUser.id,
    }).select("_id");

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    const incident = await IncidentModel.findById(id).select("_id project");
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: "Incident not found",
      });
    }

    const role = await ProjectRoleModel.findOne({
      employee: employee._id,
      project: incident.project,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Role not found for the employee in this project",
      });
    }

    const currentStatus = await IncidentStatusHistoryModel.findOne({
      incident: id,
      role: role._id,
    }).sort({ createdAt: -1 });

    if (!currentStatus) {
      return res.status(404).json({
        success: false,
        error: "No status history found for this incident and role",
      });
    }

    return res.status(200).json({
      success: true,
      data: currentStatus,
      message: "Incident status history retrieved successfully",
    });
  } catch (error) {
    console.log("error: ", error);
    return res.status(500).json({
      success: false,
      error:
        "Internal server error in retrieving incident status history by role",
    });
  }
};

export const updateIncidentStatusHistoryByRole = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  const { status } = req.body;
  try {
    const employee = await EmployeeModel.findOne({
      user: currentUser.id,
    }).select("_id");

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    const incident = await IncidentModel.findById(id).select("_id project");
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: "Incident not found",
      });
    }

    const role = await ProjectRoleModel.findOne({
      employee: employee._id,
      project: incident.project,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Role not found for the employee in this project",
      });
    }

    const currentStatus = await IncidentStatusHistoryModel.findOne({
      incident: id,
      role: role._id,
    }).sort({ createdAt: -1 });

    if (!currentStatus) {
      return res.status(404).json({
        success: false,
        error: "No status history found for this incident and role",
      });
    }

    const newStatus = new IncidentStatusHistoryModel({
      status,
      old:currentStatus?.status,
      role: role._id,
      incident: incident._id,
    });

    await newStatus.save();

    return res.status(200).json({
      success: true,
      data: newStatus,
      message: "Incident status history updated successfully",
    });
  } catch (error) {
    console.log("error: ", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error in updating incident status history",
    });
  }
};

export const getIncidentUpdateHistory = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    let options = getPaginationOptions(req, {
      populate: [
        {
          path: "role",
          model: "Project_Roles",
          populate: [
            {
              path: "employee",
              model: "Employee",
              select: "name designation",
            },
            {
              path: "role",
              model: "Role",
              select: "title",
            },
            {
              path: "team",
              model: "Team",
              select: "name",
            },
          ],
        },
      ],
      sort: { createdAt: -1 },
      filter: {
        incident: new mongoose.Types.ObjectId(id),
      },
    });

    const result = await paginate(IncidentHistoryModel, options);

    return res.status(200).json({
      success: true,
      ...result,
      message: "Incident history retrieved successfully",
    });
  } catch (error) {
    console.log("error: ", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error in retrieving incident history",
    });
  }
};
