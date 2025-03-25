import { Request, Response } from "express";
import IncidentStatusHistoryModel from "../models/IncidentStatusHistoryModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import mongoose from "mongoose";
import IncidentHistoryModel from "../models/IncidentHistoryModel";

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
          as: "role"
        }
      },
      {
        $unwind: "$role"
      },
      {
        $lookup: {
          from: "employees",
          localField: "role.employee",
          foreignField: "_id",
          as: "role.employee"
        }
      },
      {
        $unwind: "$role.employee"
      },
      {
        $lookup: {
          from: "roles",
          localField: "role.role",
          foreignField: "_id",
          as: "role.role"
        }
      },
      {
        $unwind: "$role.role"
      },
      {
        $lookup: {
          from: "teams",
          localField: "role.team",
          foreignField: "_id",
          as: "role.team"
        }
      },
      {
        $unwind: {
          path: "$role.team",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            $ifNull: ["$role.team.name", null]
          },
          data: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          _id: 0,
          team: "$_id",
          data: 1
        }
      }
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
