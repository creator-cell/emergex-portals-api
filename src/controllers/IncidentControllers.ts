import { Request, Response } from "express";
import IncidentModel from "../models/IncidentModel";
import fs from "fs";
import { ICustomRequest } from "../types/express";
import EmployeeModel from "../models/EmployeeModel";
import ProjectModel from "../models/ProjectModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import { generateUniqueIncidentId } from "../helper/IncidentFunctions";

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
    } = req.body;
    let id = req.body.id;

    const isIdExist = await IncidentModel.findOne({id});
    if(isIdExist){
      id = await generateUniqueIncidentId();
    }

    const isEmployeeExist = await EmployeeModel.findById(assignedTo);
    if (!isEmployeeExist) {
      return res
        .status(400)
        .json({
          success: false,
          error: req.i18n.t(
            "projectValidationMessages.response.createProject.employeeNotExist"
          ),
        });
    }

    const isProjectexist = await ProjectModel.findById(projectId);
    if (!isProjectexist) {
      return res
        .status(400)
        .json({
          success: false,
          error: req.i18n.t(
            "projectValidationMessages.response.getProjectById.notFound"
          ),
        });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const audioPath = files.audio
      ? `/uploads/audio/${files.audio[0].filename}`
      : undefined;
    const imagePaths = files.image
      ? files.image.map((file) => `/uploads/images/${file.filename}`)
      : undefined;
    const signaturePath = files.signature
      ? `/uploads/signatures/${files.signature[0].filename}`
      : undefined;

    const newIncident = new IncidentModel({
      id,
      project: projectId,
      level,
      type,
      description,
      audio: audioPath,
      status,
      assignedTo,
      countOfInjuredPeople,
      countOfTotalPeople,
      location,
      damageAssets,
      finance,
      utilityAffected,
      image: imagePaths,
      signature: signaturePath,
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
    return res
      .status(500)
      .json({
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
    return res
      .status(500)
      .json({
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
    return res
      .status(500)
      .json({
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
        error: `${req.i18n.t("incidentValidationMessages.response.notExist")} ${id}`,
      });
    }

    incident.status = status;
    await incident.save();

    return res.status(200).json({
      success: true,
      message: req.i18n.t("incidentValidationMessages.response.updateIncidentStatus.success"),
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: req.i18n.t("incidentValidationMessages.response.updateIncidentStatus.server"),
    });
  }
};

export const stopIncidentTimer = async(req: Request, res: Response)=>{
  const { id } = req.params;
  try {
    const incident = await IncidentModel.findById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: `${req.i18n.t("incidentValidationMessages.response.notExist")} ${id}`,
      });
    }

    if(incident.isStopped){
      return res.status(400).json({
        success: false,
        error: req.i18n.t("incidentValidationMessages.response.stopIncidentTimer.alreadyStopped"),
      });
    }

    incident.isStopped=true;
    incident.stoppedTime = new Date();
    await incident.save();

    return res.status(200).json({
      success: true,
      message: req.i18n.t("incidentValidationMessages.response.stopIncidentTimer.success"),
    });

  } catch (error) {
    return res.status(404).json({
      success: false,
      error: req.i18n.t("incidentValidationMessages.response.stopIncidentTimer.server")
    });
  }
}
