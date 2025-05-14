"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncidentStatistics = exports.stopIncidentTimer = exports.updateIncidentStatus = exports.getIncidentById = exports.deleteIncidentById = exports.getIncidentsByProject = exports.getAllIncidents = exports.updateIncidentById = exports.createIncident = void 0;
const IncidentModel_1 = __importDefault(require("../models/IncidentModel"));
const fs_1 = __importDefault(require("fs"));
const EmployeeModel_1 = __importDefault(require("../models/EmployeeModel"));
const ProjectModel_1 = __importDefault(require("../models/ProjectModel"));
const pagination_1 = require("../helper/pagination");
const IncidentFunctions_1 = require("../helper/IncidentFunctions");
const S3Bucket_1 = require("../helper/S3Bucket");
const mongoose_1 = __importDefault(require("mongoose"));
const IncidentHistoryModel_1 = __importDefault(require("../models/IncidentHistoryModel"));
const IncidentStatusHistoryModel_1 = __importDefault(require("../models/IncidentStatusHistoryModel"));
const ProjectRoleModel_1 = __importDefault(require("../models/ProjectRoleModel"));
const conversation_service_1 = __importDefault(require("../services/conversation.service"));
const ConversationModel_1 = require("../models/ConversationModel");
const createIncident = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { level, type, description, status, 
        // assignedTo,
        countOfInjuredPeople, countOfTotalPeople, location, damageAssets, finance, utilityAffected, informToTeam, termsAndConditions, projectId, images, signature, } = req.body;
        let id = req.body.id;
        const isIdExist = await IncidentModel_1.default.findOne({ id });
        if (isIdExist || !id) {
            id = await (0, IncidentFunctions_1.generateUniqueIncidentId)();
        }
        // const isEmployeeExist = await EmployeeModel.findById(assignedTo);
        // if (!isEmployeeExist) {
        //   return res.status(400).json({
        //     success: false,
        //     error: req.i18n.t(
        //       "projectValidationMessages.response.createProject.employeeNotExist"
        //     ),
        //   });
        // }
        const isProjectexist = await ProjectModel_1.default.findById(projectId);
        if (!isProjectexist) {
            return res.status(400).json({
                success: false,
                error: req.i18n.t("projectValidationMessages.response.getProjectById.notFound"),
            });
        }
        let imagePaths = [];
        if (images && Array.isArray(images)) {
            const uploadPromises = images.map(async (base64String, index) => {
                const fileName = `incident_${id}_image_${index}_${Date.now()}.jpg`;
                const uploadResponse = await (0, S3Bucket_1.UploadBase64File)(base64String, fileName, 'incident');
                return uploadResponse.Success ? uploadResponse.ImageURl : null;
            });
            const uploadedImages = await Promise.all(uploadPromises);
            imagePaths = uploadedImages.filter((url) => url !== null);
        }
        let signaturePath = null;
        if (signature) {
            const fileName = `incident_${id}_signature_image_${Date.now()}.jpg`;
            const uploadResponse = await (0, S3Bucket_1.UploadBase64File)(signature, fileName, 'signature');
            signaturePath = uploadResponse.Success ? uploadResponse.ImageURl : null;
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
        const newIncident = new IncidentModel_1.default({
            id,
            project: projectId,
            level,
            type,
            description,
            status,
            // assignedTo,
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
        const friendlyName = `conversation-${savedIncident._id}`;
        const conversation = await conversation_service_1.default.createConversation(friendlyName, currentUser.id, ConversationModel_1.ConversationIdentity.INCIDENT, ConversationModel_1.ConversationType.GROUP, savedIncident._id);
        const conversationId = conversation._id;
        // Add the creator as the first participant
        await conversation_service_1.default.addParticipant(conversationId.toString(), currentUser.id, currentUser.id);
        return res.status(201).json({
            success: true,
            message: req.i18n.t("incidentValidationMessages.response.createIncident.success"),
            data: savedIncident,
        });
    }
    catch (error) {
        if (req.files) {
            Object.values(req.files)
                .flat()
                .forEach((file) => {
                fs_1.default.unlink(file.path, (err) => {
                    if (err)
                        console.error("Error deleting file:", err);
                });
            });
        }
        console.log("error in createIncident", error);
        return res.status(500).json({
            success: false,
            error: req.i18n.t("incidentValidationMessages.response.createIncident.server"),
        });
    }
};
exports.createIncident = createIncident;
const updateIncidentById = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    const incidentId = req.params.id;
    try {
        // Fetch the existing incident
        const existingIncident = await IncidentModel_1.default.findById(incidentId);
        if (!existingIncident) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("incidentValidationMessages.response.getIncidentById.notFound"),
            });
        }
        const { level, type, description, status, 
        // assignedTo,
        countOfInjuredPeople, countOfTotalPeople, location, damageAssets, finance, utilityAffected, informToTeam, termsAndConditions, images, signature, } = req.body;
        // Track changes
        const changes = [];
        let statusChanged = false;
        let oldStatus = "";
        // Compare and update fields
        if (level && existingIncident.level !== level) {
            changes.push({
                field: "Level",
                oldValue: existingIncident.level,
                newValue: level,
            });
            existingIncident.level = level;
        }
        if (type && existingIncident.type !== type) {
            changes.push({
                field: "Type",
                oldValue: existingIncident.type,
                newValue: type,
            });
            existingIncident.type = type;
        }
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
        // if (assignedTo && existingIncident.assignedTo.toString() !== assignedTo) {
        //   changes.push({
        //     field: "assignedTo",
        //     oldValue: existingIncident.assignedTo,
        //     newValue: assignedTo,
        //   });
        //   existingIncident.assignedTo = assignedTo;
        // }
        if (countOfInjuredPeople &&
            existingIncident.countOfInjuredPeople !== countOfInjuredPeople) {
            changes.push({
                field: "Count of injured people",
                oldValue: existingIncident.countOfInjuredPeople,
                newValue: countOfInjuredPeople,
            });
            existingIncident.countOfInjuredPeople = countOfInjuredPeople;
        }
        if (countOfTotalPeople &&
            existingIncident.countOfTotalPeople !== countOfTotalPeople) {
            changes.push({
                field: "Count of total people",
                oldValue: existingIncident.countOfTotalPeople,
                newValue: countOfTotalPeople,
            });
            existingIncident.countOfTotalPeople = countOfTotalPeople;
        }
        if (location &&
            existingIncident.location !== location) {
            changes.push({
                field: "Location",
                oldValue: existingIncident.location,
                newValue: location,
            });
            existingIncident.location = location;
        }
        if (damageAssets &&
            Array.isArray(damageAssets) &&
            !damageAssets.every((item, index) => item === existingIncident.damageAssets[index])) {
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
        if (utilityAffected &&
            JSON.stringify(existingIncident.utilityAffected) !==
                JSON.stringify(utilityAffected)) {
            changes.push({
                field: "Utility Affected",
                oldValue: existingIncident.utilityAffected,
                newValue: utilityAffected,
            });
            existingIncident.utilityAffected = utilityAffected;
        }
        if (informToTeam && existingIncident.informToTeam !== informToTeam) {
            changes.push({
                field: "Inform to Team",
                oldValue: existingIncident.informToTeam,
                newValue: informToTeam,
            });
            existingIncident.informToTeam = informToTeam;
        }
        if (termsAndConditions &&
            existingIncident.termsAndConditions !== termsAndConditions) {
            changes.push({
                field: "Terms and Conditions",
                oldValue: existingIncident.termsAndConditions,
                newValue: termsAndConditions,
            });
            existingIncident.termsAndConditions = termsAndConditions;
        }
        // if (projectId && existingIncident.project.toString() !== projectId) {
        //   changes.push({
        //     field: "projectId",
        //     oldValue: existingIncident.project,
        //     newValue: projectId,
        //   });
        //   existingIncident.project = projectId;
        // }
        // Handle image updates (if needed)
        if (images &&
            Array.isArray(images) &&
            !images.every((item) => item.startsWith("https"))) {
            let imagePaths = images.filter((item) => item.startsWith("https"));
            let imageToUpload = images.filter((item) => !item.startsWith("https"));
            const uploadPromises = imageToUpload.map(async (base64String, index) => {
                const fileName = `incident_${incidentId}_image_${index}_${Date.now()}.jpg`;
                const uploadResponse = await (0, S3Bucket_1.UploadBase64File)(base64String, fileName, 'incident');
                return uploadResponse.Success ? uploadResponse.ImageURl : null;
            });
            const uploadedImages = await Promise.all(uploadPromises);
            const imagesUri = uploadedImages.filter((url) => url !== null);
            imagePaths = [...imagePaths, ...imagesUri];
            existingIncident.image = [...imagePaths];
            changes.push({
                field: "Images",
                newValue: `${existingIncident.image.length > imagePaths.length
                    ? "Some images are deleted"
                    : existingIncident.image.length < imagePaths.length
                        ? "Some images added "
                        : "Some images replaced"}`,
                oldValue: "old images",
            });
        }
        // Handle signature updates (if needed)
        let signaturePath = null;
        if (signature && !signature.startsWith("https://")) {
            const fileName = `incident_${incidentId}_signature_image_${Date.now()}.jpg`;
            const uploadResponse = await (0, S3Bucket_1.UploadBase64File)(signature, fileName, 'signature');
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
        const employee = await EmployeeModel_1.default.findOne({ user: currentUser.id });
        const role = await ProjectRoleModel_1.default.findOne({
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
            await IncidentHistoryModel_1.default.insertMany(historyEntries);
        }
        if (statusChanged && oldStatus !== status) {
            await IncidentStatusHistoryModel_1.default.create({
                incident: existingIncident._id,
                role: role?._id,
                old: oldStatus,
                status,
            });
        }
        // Return success response
        return res.status(200).json({
            success: true,
            message: req.i18n.t("incidentValidationMessages.response.updateIncidentById.success"),
            data: updatedIncident,
        });
    }
    catch (error) {
        console.error("Error in updateIncidentById:", error);
        return res.status(500).json({
            success: false,
            error: req.i18n.t("incidentValidationMessages.response.updateIncidentById.server"),
        });
    }
};
exports.updateIncidentById = updateIncidentById;
const getAllIncidents = async (req, res) => {
    try {
        const incidents = await IncidentModel_1.default.find();
        return res.status(200).json({
            success: true,
            message: req.i18n.t("incidentValidationMessages.response.getAllIncidents.success"),
            data: incidents,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("incidentValidationMessages.response.getAllIncidents.server"),
        });
    }
};
exports.getAllIncidents = getAllIncidents;
const getIncidentsByProject = async (req, res) => {
    const { id } = req.params;
    try {
        const options = (0, pagination_1.getPaginationOptions)(req, {
            sort: { createdAt: -1 },
            filter: { project: id },
            populate: [
                // {
                //   path: "assignedTo",
                //   model: "Employee",
                //   select: "name email designation contactNo",
                // },
                // {
                //   path: "location",
                //   model: "Worksite",
                //   select: "name",
                // },
                {
                    path: "project",
                    model: "Project",
                },
            ],
        });
        const result = await (0, pagination_1.paginate)(IncidentModel_1.default, options);
        if (result.data.length === 0) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("incidentValidationMessages.response.getIncidentByProjectId.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("incidentValidationMessages.response.getIncidentByProjectId.success"),
            ...result,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("incidentValidationMessages.response.getIncidentByProjectId.server"),
        });
    }
};
exports.getIncidentsByProject = getIncidentsByProject;
const deleteIncidentById = async (req, res) => {
    const { id } = req.params;
    try {
        const incident = await IncidentModel_1.default.findById(id);
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
            message: req.i18n.t("incidentValidationMessages.response.deleteIncidentById.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("incidentValidationMessages.response.deleteIncidentById.server"),
        });
    }
};
exports.deleteIncidentById = deleteIncidentById;
const getIncidentById = async (req, res) => {
    const { id } = req.params;
    try {
        const incident = await IncidentModel_1.default.findById(id)
            // .populate({
            //   path: "assignedTo",
            //   model: "Employee",
            //   select: "name email designation contactNo",
            // })
            .populate({
            path: "project",
            model: "Project",
        });
        // .populate({
        //   path: "location",
        //   model: "Worksite",
        //   select: "name",
        // });
        if (!incident) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("incidentValidationMessages.response.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("incidentValidationMessages.response.getIncidentById.success"),
            data: incident,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("incidentValidationMessages.response.getIncidentById.server"),
        });
    }
};
exports.getIncidentById = getIncidentById;
const updateIncidentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const incident = await IncidentModel_1.default.findById(id);
        if (!incident) {
            return res.status(200).json({
                success: false,
                error: `${req.i18n.t("incidentValidationMessages.response.notExist")} ${id}`,
            });
        }
        const old = incident.status;
        incident.status = status;
        await incident.save();
        const employee = await EmployeeModel_1.default.findOne({ user: currentUser.id });
        const role = await ProjectRoleModel_1.default.findOne({
            employee: employee?._id,
            project: incident.project,
        });
        await IncidentStatusHistoryModel_1.default.create({
            incident: id,
            role: role?._id,
            old,
            status,
        });
        return res.status(200).json({
            success: true,
            message: req.i18n.t("incidentValidationMessages.response.updateIncidentStatus.success"),
        });
    }
    catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            message: req.i18n.t("incidentValidationMessages.response.updateIncidentStatus.server"),
        });
    }
};
exports.updateIncidentStatus = updateIncidentStatus;
const stopIncidentTimer = async (req, res) => {
    const { id } = req.params;
    try {
        const incident = await IncidentModel_1.default.findById(id);
        if (!incident) {
            return res.status(200).json({
                success: false,
                error: `${req.i18n.t("incidentValidationMessages.response.notExist")} ${id}`,
            });
        }
        if (incident.isStopped) {
            return res.status(400).json({
                success: false,
                error: req.i18n.t("incidentValidationMessages.response.stopIncidentTimer.alreadyStopped"),
            });
        }
        incident.isStopped = true;
        incident.stoppedTime = new Date();
        await incident.save();
        return res.status(200).json({
            success: true,
            message: req.i18n.t("incidentValidationMessages.response.stopIncidentTimer.success"),
        });
    }
    catch (error) {
        return res.status(200).json({
            success: false,
            error: req.i18n.t("incidentValidationMessages.response.stopIncidentTimer.server"),
        });
    }
};
exports.stopIncidentTimer = stopIncidentTimer;
const getIncidentStatistics = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { project } = req.query;
        const matchStage = {};
        if (project) {
            matchStage.project = new mongoose_1.default.Types.ObjectId(project);
        }
        if (!project && currentUser) {
            matchStage.createdBy = new mongoose_1.default.Types.ObjectId(currentUser.id);
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
                $sort: { _id: 1 },
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
        const incidentsByMonth = await IncidentModel_1.default.aggregate(pipeline);
        const totalIncidents = await IncidentModel_1.default.countDocuments(matchStage);
        res.status(200).json({
            success: true,
            message: req.i18n.t("incidentValidationMessages.response.getIncidentStatistics.success"),
            totalIncidents,
            incidentsByMonth,
        });
    }
    catch (error) {
        console.error("Error fetching incident statistics:", error);
        res.status(500).json({
            success: false,
            error: req.i18n.t("incidentValidationMessages.response.getIncidentStatistics.server"),
        });
    }
};
exports.getIncidentStatistics = getIncidentStatistics;
