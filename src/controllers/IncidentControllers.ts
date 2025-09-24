import { Request, Response } from "express";
import IncidentModel from "../models/IncidentModel";
import fs from "fs";
import { ICustomRequest } from "../types/express";
import EmployeeModel from "../models/EmployeeModel";
import ProjectModel from "../models/ProjectModel";
import { generateUniqueIncidentId } from "../helper/IncidentFunctions";
import { UploadBase64File } from "../helper/S3Bucket";
import mongoose from "mongoose";
import IncidentHistoryModel from "../models/IncidentHistoryModel";
import IncidentStatusHistoryModel from "../models/IncidentStatusHistoryModel";
import ProjectRoleModel from "../models/ProjectRoleModel";
import conversationService from "../services/conversation.service";
import {
  ConversationIdentity,
  ConversationType,
} from "../models/ConversationModel";

export const createIncident = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      description,
      countOfInjuredPeople,
      countOfTotalPeople,
      location,
      damageAssets,
      finance,
      utilityAffected,
      projectId,
      images,
      signature,
    } = req.body;

    let id = req.body.id;

    const isIdExist = await IncidentModel.findOne({ id }).session(session);
    if (isIdExist || !id) {
      id = await generateUniqueIncidentId();
    }

    const isProjectexist = await ProjectModel.findById(projectId).session(
      session
    );
    if (!isProjectexist) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: req.i18n.t(
          "projectValidationMessages.response.getProjectById.notFound"
        ),
      });
    }

    let imagePaths: string[] = [];
    if (images && Array.isArray(images)) {
      const uploadPromises = images.map(async (base64String, index) => {
        const fileName = `incident_${id}_image_${index}_${Date.now()}.jpg`;
        const uploadResponse = await UploadBase64File(
          base64String,
          fileName,
          "incident"
        );
        return uploadResponse.Success ? uploadResponse.ImageURl : null;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      imagePaths = uploadedImages.filter((url): url is string => url !== null);
    }

    let signaturePath = null;
    if (signature) {
      const fileName = `incident_${id}_signature_image_${Date.now()}.jpg`;
      const uploadResponse = await UploadBase64File(
        signature,
        fileName,
        "signature"
      );
      signaturePath = uploadResponse.Success ? uploadResponse.ImageURl : null;
    }

    if (imagePaths.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        succees: false,
        error: req.i18n.t(
          "incidentValidationMessages.response.createIncident.imageUploadError"
        ),
      });
    }

    if (!signaturePath) {
      await session.abortTransaction();
      return res.status(400).json({
        succees: false,
        error: req.i18n.t(
          "incidentValidationMessages.response.createIncident.signatureUploadError"
        ),
      });
    }

    const newIncident = new IncidentModel({
      id,
      project: projectId,
      description,
      countOfInjuredPeople,
      countOfTotalPeople,
      location,
      damageAssets,
      finance,
      utilityAffected,
      image: imagePaths,
      signature: signaturePath,
      createdBy: currentUser.id,
    });

    const savedIncident = await newIncident.save({ session });

    const friendlyName = `conversation-${savedIncident._id}`;

    const conversation = await conversationService.createConversation(
      friendlyName,
      currentUser.id,
      ConversationIdentity.INCIDENT,
      ConversationType.GROUP,
      savedIncident._id as mongoose.Types.ObjectId,
      session
    );

    if (!conversation) {
      throw new Error("Failed to create conversation"); // ADDED ERROR THROWING
    }

    const conversationId = (conversation as { _id: string })._id;

    const roles = await ProjectRoleModel.find({
      project: projectId,
    }).session(session);

    const employeeIds = roles.map((role) => role.employee);

    const employees = await EmployeeModel.find({
      _id: {
        $in: employeeIds,
      },
    }).session(session);

    await Promise.all(
      employees.map(async (employee) => {
        await conversationService.addParticipant(
          conversationId.toString(),
          employee.user.toString(),
          employee.user.toString(),
          session
        );
      })
    );

    await Promise.all(
      roles.map(async (role) => {
        await IncidentStatusHistoryModel.create(
          [
            {
              old: null,
              status: 'Not-Approved',
              role: role._id,
              incident: savedIncident._id,
            },
          ],
          { session }
        );
      })
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.createIncident.success"
      ),
      data: savedIncident,
    });
  } catch (error: any) {
    await session.abortTransaction();
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
    }
    console.log("error in createIncident", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "incidentValidationMessages.response.createIncident.server"
      ),
    });
  } finally {
    session.endSession();
  }
};

export const markedAsNearMiss = async (req: Request, res: Response) => {

  const { id } = req.params;
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  if (!id) return res.status(404).json({ success: false, error: 'Id not Found' });

  try {

    const incident = await IncidentModel.findById(id);

    if (!incident) return res.status(404).json({ status: false, error: 'Incident not found with this Id' });

    if (incident.isApproved) return res.status(400).json({ status: false, error: 'Cannot Mark Incident as Near Miss after being approved' });

    await IncidentModel.findByIdAndUpdate(incident._id, { isNearMissCase: true });

    const employee = await EmployeeModel.findOne({ user: currentUser.id });

    const role = await ProjectRoleModel.findOne({
      employee: employee?._id,
      project: incident.project,
    });

    if (role) {

      await IncidentStatusHistoryModel.create(
        [
          {
            old: 'Not-Approved',
            status: 'Completed',
            role: role._id,
            incident: incident._id,
          },
        ],
      );

      const historyEntry = [{
        title: `Incident Marked as Near Miss By Admin`,
        role: role.id,
        incident: incident._id,
      }]

      await IncidentHistoryModel.insertMany(historyEntry);

    }

    return res.json({ succes: true, message: 'Incident has been marked as Near Miss' });

  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }


}

export const approveIncidentById = async (req: Request, res: Response) => {

  const { id } = req.params;

  if (!id) return res.status(404).json({ success: false, error: 'Id not Found' });

  try {

    const incident = await IncidentModel.findById(id);

    if (!incident) return res.status(404).json({ status: false, error: 'Incident not. found with this Id' });

    await IncidentModel.findByIdAndUpdate(id, { isApproved: true, status: 'Assigned' });

    const roles = await ProjectRoleModel.find({
      project: incident.project,
    })

    await Promise.all(
      roles.map(async (role) => {
        await IncidentStatusHistoryModel.create(
          [
            {
              old: 'Not-Approved',
              status: 'Assigned',
              role: role._id,
              incident: incident._id,
            },
          ],
        );
      })
    );

    return res.json({ succes: true, message: 'Incident has been approved' });

  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }

}

export const updateIncidentById = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  const incidentId = req.params.id;

  try {
    // Fetch the existing incident
    const existingIncident = await IncidentModel.findById(incidentId);
    if (!existingIncident) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "incidentValidationMessages.response.getIncidentById.notFound"
        ),
      });
    }

    const {
      description,
      status,
      countOfInjuredPeople,
      countOfTotalPeople,
      location,
      damageAssets,
      finance,
      utilityAffected,
      images,
      signature,
    } = req.body;

    // Track changes
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    let statusChanged: boolean = false;
    let oldStatus: string = "";


    if (description && existingIncident.description !== description) {
      changes.push({
        field: "Description",
        oldValue: existingIncident.description,
        newValue: description,
      });
      existingIncident.description = description;
    }

    if (status && existingIncident.status !== status) {
      changes.push({
        field: "Status",
        oldValue: existingIncident.status,
        newValue: status,
      });
      statusChanged = true;
      oldStatus = existingIncident.status;
      existingIncident.status = status;
    }


    if (
      countOfInjuredPeople &&
      existingIncident.countOfInjuredPeople !== countOfInjuredPeople
    ) {
      changes.push({
        field: "Count of injured people",
        oldValue: existingIncident.countOfInjuredPeople,
        newValue: countOfInjuredPeople,
      });
      existingIncident.countOfInjuredPeople = countOfInjuredPeople;
    }

    if (
      countOfTotalPeople &&
      existingIncident.countOfTotalPeople !== countOfTotalPeople
    ) {
      changes.push({
        field: "Count of total people",
        oldValue: existingIncident.countOfTotalPeople,
        newValue: countOfTotalPeople,
      });
      existingIncident.countOfTotalPeople = countOfTotalPeople;
    }

    if (location && existingIncident.location !== location) {
      changes.push({
        field: "Location",
        oldValue: existingIncident.location,
        newValue: location,
      });
      existingIncident.location = location;
    }

    if (
      damageAssets &&
      Array.isArray(damageAssets) &&
      !damageAssets.every(
        (item: string, index: number) =>
          item === existingIncident.damageAssets[index]
      )
    ) {
      changes.push({
        field: "Damage Assets",
        oldValue: "old damage assets value",
        newValue: "new damage assets value",
      });
      existingIncident.damageAssets = damageAssets;
    }

    if (finance && existingIncident.finance !== finance) {
      changes.push({
        field: "Finance",
        oldValue: existingIncident.finance,
        newValue: finance,
      });
      existingIncident.finance = finance;
    }

    if (
      utilityAffected &&
      JSON.stringify(existingIncident.utilityAffected) !==
      JSON.stringify(utilityAffected)
    ) {
      changes.push({
        field: "Utility Affected",
        oldValue: existingIncident.utilityAffected,
        newValue: utilityAffected,
      });
      existingIncident.utilityAffected = utilityAffected;
    }


    if (
      images &&
      Array.isArray(images) &&
      !images.every((item: string) => item.startsWith("https"))
    ) {
      let imagePaths: string[] = images.filter((item: string) =>
        item.startsWith("https")
      );
      let imageToUpload: string[] = images.filter(
        (item: string) => !item.startsWith("https")
      );
      const uploadPromises = imageToUpload.map(async (base64String, index) => {
        const fileName = `incident_${existingIncident.id}_image_${index}_${Date.now()}.jpg`;
        const uploadResponse = await UploadBase64File(
          base64String,
          fileName,
          "incident"
        );
        return uploadResponse.Success ? uploadResponse.ImageURl : null;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const imagesUri = uploadedImages.filter(
        (url): url is string => url !== null
      );
      imagePaths = [...imagePaths, ...imagesUri];
      existingIncident.image = [...imagePaths];
      changes.push({
        field: "Images",
        newValue: `${existingIncident.image.length > imagePaths.length
          ? "Some images are deleted"
          : existingIncident.image.length < imagePaths.length
            ? "Some images added "
            : "Some images replaced"
          }`,
        oldValue: "old images",
      });
    }

    // Handle signature updates (if needed)
    let signaturePath = null;
    if (signature && !signature.startsWith("https://")) {
      const fileName = `incident_${incidentId}_signature_image_${Date.now()}.jpg`;
      const uploadResponse = await UploadBase64File(
        signature,
        fileName,
        "signature"
      );
      signaturePath = uploadResponse.Success ? uploadResponse.ImageURl : null;
      if (signaturePath) {
        existingIncident.signature = signaturePath;
        changes.push({
          field: "Signature",
          oldValue: "old signature",
          newValue: "new signature",
        });
      }
    }

    // Save the updated incident
    const updatedIncident = await existingIncident.save();

    const employee = await EmployeeModel.findOne({ user: currentUser.id });
    const role = await ProjectRoleModel.findOne({
      employee: employee?._id,
      project: existingIncident.project,
    });

    // Log changes to IncidentHistoryModel
    if (changes.length > 0) {
      const historyEntries = changes.map((change) => ({
        title: `${change.field} changed from ${change.oldValue} to ${change.newValue}`,
        role: role?.id,
        incident: incidentId,
      }));

      await IncidentHistoryModel.insertMany(historyEntries);
    }

    if (statusChanged && oldStatus !== status) {
      await IncidentStatusHistoryModel.create({
        incident: existingIncident._id,
        role: role?._id,
        old: oldStatus,
        status,
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.updateIncidentById.success"
      ),
      data: updatedIncident,
    });
  } catch (error) {
    console.error("Error in updateIncidentById:", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "incidentValidationMessages.response.updateIncidentById.server"
      ),
    });
  }
};

export const getAllIncidents = async (req: Request, res: Response) => {
  try {
    const incidents = await IncidentModel.find();
    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.getAllIncidents.success"
      ),
      data: incidents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "incidentValidationMessages.response.getAllIncidents.server"
      ),
    });
  }
};

export const getIncidentsByProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {

    const employee = await EmployeeModel.findOne({
      user: currentUser.id
    })

    if (!employee) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("employeeValidationMessages.response.getEmployeeById.notFound")
      })
    }

    const userRole = await ProjectRoleModel.findOne({
      project: id,
      employee: employee._id
    })

    if (!userRole) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("projectRoleValidationMessages.response.notFoundInIncident")
      })
    }

    const incidents = await IncidentModel.aggregate([
      // 1. Match by project ID
      {
        $match: {
          project: new mongoose.Types.ObjectId(id),
          isDeleted: { $ne: true },
        },
      },

      // 2. Lookup project role of the current user
      {
        $lookup: {
          from: "project_roles",
          let: { incidentProject: "$project" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employee", employee?._id] },
                    { $eq: ["$project", "$$incidentProject"] },
                  ],
                },
              },
            },
            { $limit: 1 } // Only need one role per user in project
          ],
          as: "currentUserRole",
        },
      },
      {
        $unwind: {
          path: "$currentUserRole",
          preserveNullAndEmptyArrays: true, // in case no role found
        },
      },

      // 3. Lookup status history using the found role
      {
        $lookup: {
          from: "incident_status_histories",
          let: {
            incidentId: "$_id",
            userRoleId: "$currentUserRole._id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$incident", "$$incidentId"] },
                    { $eq: ["$role", "$$userRoleId"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "currentStatusHistory",
        },
      },
      {
        $addFields: {
          currentStatus: {
            $arrayElemAt: ["$currentStatusHistory.status", 0],
          },
        },
      },
      {
        $project: {
          currentStatusHistory: 0, // remove internal array
        },
      },
    ]);


    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.getIncidentByProjectId.success"
      ),
      data: incidents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "incidentValidationMessages.response.getIncidentByProjectId.server"
      ),
    });
  }
};

export const deleteIncidentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const incident = await IncidentModel.findById(id);
    if (!incident) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("incidentValidationMessages.response.notFound"),
      });
    }

    incident.isDeleted = true;
    await incident.save();

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.deleteIncidentById.success"
      ),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "incidentValidationMessages.response.deleteIncidentById.server"
      ),
    });
  }
};

export const getIncidentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const incident = await IncidentModel.findById(id).populate({
      path: "project",
      model: "Project",
    });

    if (!incident) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("incidentValidationMessages.response.notFound"),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.getIncidentById.success"
      ),
      data: incident,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "incidentValidationMessages.response.getIncidentById.server"
      ),
    });
  }
};

export const updateIncidentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const incident = await IncidentModel.findById(id);
    if (!incident) {
      return res.status(200).json({
        success: false,
        error: `${req.i18n.t(
          "incidentValidationMessages.response.notExist"
        )} ${id}`,
      });
    }

    const old = incident.status;

    incident.status = status;
    await incident.save();

    const employee = await EmployeeModel.findOne({ user: currentUser.id });

    const role = await ProjectRoleModel.findOne({
      employee: employee?._id,
      project: incident.project,
    });

    await IncidentStatusHistoryModel.create({
      incident: id,
      role: role?._id,
      old,
      status,
    });

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.updateIncidentStatus.success"
      ),
    });
  } catch (error) {
    console.log("error: ", error);
    return res.status(500).json({
      success: false,
      message: req.i18n.t(
        "incidentValidationMessages.response.updateIncidentStatus.server"
      ),
    });
  }
};

export const stopIncidentTimer = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const incident = await IncidentModel.findById(id);
    if (!incident) {
      return res.status(200).json({
        success: false,
        error: `${req.i18n.t(
          "incidentValidationMessages.response.notExist"
        )} ${id}`,
      });
    }

    if (incident.isStopped) {
      return res.status(400).json({
        success: false,
        error: req.i18n.t(
          "incidentValidationMessages.response.stopIncidentTimer.alreadyStopped"
        ),
      });
    }

    incident.isStopped = true;
    incident.stoppedTime = new Date();
    await incident.save();

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.stopIncidentTimer.success"
      ),
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      error: req.i18n.t(
        "incidentValidationMessages.response.stopIncidentTimer.server"
      ),
    });
  }
};

export const getIncidentStatistics = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { project } = req.query;
    const matchStage: any = {};

    if (project) {
      matchStage.project = new mongoose.Types.ObjectId(project as string);
    }

    if (!project && currentUser) {
      matchStage.createdBy = new mongoose.Types.ObjectId(currentUser.id);
    }

    const pipeline = [
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalIncidents: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 as 1 },
      },
      {
        $project: {
          month: {
            $arrayElemAt: [
              [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ],
              { $subtract: ["$_id", 1] },
            ],
          },
          totalIncidents: 1,
          _id: 0,
        },
      },
    ];

    const incidentsByMonth = await IncidentModel.aggregate(pipeline);

    const totalIncidents = await IncidentModel.countDocuments(matchStage);

    res.status(200).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.getIncidentStatistics.success"
      ),
      totalIncidents,
      incidentsByMonth,
    });
  } catch (error) {
    console.error("Error fetching incident statistics:", error);
    res.status(500).json({
      success: false,
      error: req.i18n.t(
        "incidentValidationMessages.response.getIncidentStatistics.server"
      ),
    });
  }
};
