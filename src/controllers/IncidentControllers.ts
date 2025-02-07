import { Request, Response } from "express";
import IncidentModel from "../models/IncidentModel";
import fs from "fs";
import { ICustomRequest } from "../types/express";
import EmployeeModel from "../models/EmployeeModel";
import ProjectModel from "../models/ProjectModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import { generateUniqueIncidentId } from "../helper/IncidentFunctions";
import { UploadBase64File } from "../helper/S3Bucket";
import mongoose from "mongoose";

export const createIncident = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const {
      level,
      type,
      description,
      status,
      assignedTo,
      countOfInjuredPeople,
      countOfTotalPeople,
      location,
      damageAssets,
      finance,
      utilityAffected,
      informToTeam,
      termsAndConditions,
      projectId,
      images,
      signature,
    } = req.body;

    // console.log("body: ",req.body)

    let id = req.body.id;

    const isIdExist = await IncidentModel.findOne({ id });
    if (isIdExist || !id) {
      id = await generateUniqueIncidentId();
    }

    const isEmployeeExist = await EmployeeModel.findById(assignedTo);
    if (!isEmployeeExist) {
      return res.status(400).json({
        success: false,
        error: req.i18n.t(
          "projectValidationMessages.response.createProject.employeeNotExist"
        ),
      });
    }

    const isProjectexist = await ProjectModel.findById(projectId);
    if (!isProjectexist) {
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
        const uploadResponse = await UploadBase64File(base64String, fileName);
        return uploadResponse.Success ? uploadResponse.ImageURl : null;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      imagePaths = uploadedImages.filter((url): url is string => url !== null);
    }

    let signaturePath = null;
    if (signature) {
      const fileName = `incident_${id}_signature_image_${Date.now()}.jpg`;
      const uploadResponse = await UploadBase64File(signature, fileName);
      signaturePath=uploadResponse.Success ? uploadResponse.ImageURl : null;
    }

    if (imagePaths.length === 0) {
      return res.status(400).json({
        succees: false,
        error: req.i18n.t("incidentValidationMessages.response.createIncident.imageUploadError"),
      });
    }

    if (!signaturePath) {
      return res.status(400).json({
        succees: false,
        error: req.i18n.t("incidentValidationMessages.response.createIncident.signatureUploadError"),
      });
    }

    const newIncident = new IncidentModel({
      id,
      project: projectId,
      level,
      type,
      description,
      status,
      assignedTo,
      countOfInjuredPeople,
      countOfTotalPeople,
      location,
      damageAssets,
      finance,
      utilityAffected,
      image: imagePaths,
      signature:signaturePath,
      informToTeam,
      termsAndConditions,
      createdBy: currentUser.id,
    });

    const savedIncident = await newIncident.save();
    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.createIncident.success"
      ),
      data: savedIncident,
    });
  } catch (error: any) {
    // if (req.files) {
    //   Object.values(req.files)
    //     .flat()
    //     .forEach((file) => {
    //       fs.unlink(file.path, (err) => {
    //         if (err) console.error("Error deleting file:", err);
    //       });
    //     });
    // }
    console.log("error in createIncident", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "incidentValidationMessages.response.createIncident.server"
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
  try {
    const options = getPaginationOptions(req, {
      sort: { createdAt: -1 },
      filter: { project: id },
      populate: [
        {
          path: "assignedTo",
          model: "Employee",
          select: "name email designation contactNo",
        },
        {
          path: "project",
          model: "Project",
        },
      ],
    });

    const result = await paginate(IncidentModel, options);

    if (result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: req.i18n.t(
          "incidentValidationMessages.response.getIncidentByProjectId.notFound"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.getIncidentByProjectId.success"
      ),
      ...result,
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
      return res.status(404).json({
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
    const incident = await IncidentModel.findById(id)
      .populate({
        path: "assignedTo",
        model: "Employee",
        select: "name email designation contactNo",
      })
      .populate({
        path: "project",
        model: "Project",
      });

    if (!incident) {
      return res.status(404).json({
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
  try {
    const incident = await IncidentModel.findById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: `${req.i18n.t(
          "incidentValidationMessages.response.notExist"
        )} ${id}`,
      });
    }

    incident.status = status;
    await incident.save();

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "incidentValidationMessages.response.updateIncidentStatus.success"
      ),
    });
  } catch (error) {
    return res.status(200).json({
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
      return res.status(404).json({
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
    return res.status(404).json({
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
    const {project}=req.query;
    const matchStage: any = {};

    if(project){
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
      message: req.i18n.t("incidentValidationMessages.response.getIncidentStatistics.success"),
      totalIncidents,
      incidentsByMonth,
    });
  } catch (error) {
    console.error("Error fetching incident statistics:", error);
    res.status(500).json({
      success: false,
      error: req.i18n.t("incidentValidationMessages.response.getIncidentStatistics.server"),
    });
  }
};
