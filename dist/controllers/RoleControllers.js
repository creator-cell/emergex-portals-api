"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.updateRole = exports.getRoleById = exports.getAllRoles = exports.createRole = void 0;
const RoleModel_1 = __importDefault(require("../models/RoleModel"));
// Create a new role
const createRole = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { title, description } = req.body;
        const isRoleExist = await RoleModel_1.default.findOne({
            title,
            createdBy: currentUser.id,
        });
        if (isRoleExist) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("roleValidationMessages.response.createRole.exist"),
            });
        }
        const role = new RoleModel_1.default({
            title,
            description,
            createdBy: currentUser.id,
        });
        await role.save();
        return res
            .status(201)
            .json({ success: true, message: req.i18n.t("roleValidationMessages.response.createRole.success"), role });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: req.i18n.t("roleValidationMessages.response.createRole.server"),
            error: error.message,
        });
    }
};
exports.createRole = createRole;
// Get all roles
const getAllRoles = async (req, res) => {
    try {
        const customReq = req;
        const currentUser = customReq.user;
        const roles = await RoleModel_1.default.find({ isTrash: false });
        return res.status(200).json({
            success: true,
            data: roles,
            messsage: req.i18n.t("roleValidationMessages.response.getAllRoles.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: req.i18n.t("roleValidationMessages.response.getAllRoles.server"),
            error: error.message,
        });
    }
};
exports.getAllRoles = getAllRoles;
// Get a single role by ID
const getRoleById = async (req, res) => {
    try {
        const role = await RoleModel_1.default.findById(req.params.id);
        if (!role) {
            return res.status(200).json({ success: false, message: req.i18n.t("roleValidationMessages.response.notFound") });
        }
        return res.status(200).json({
            success: true,
            data: role,
            message: req.i18n.t("roleValidationMessages.response.getRoleById.success"),
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: req.i18n.t("roleValidationMessages.response.getRoleById.server"), error: error.message });
    }
};
exports.getRoleById = getRoleById;
// Update a role by ID
const updateRole = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { title, description } = req.body;
        const { id } = req.params;
        const isRoleExist = await RoleModel_1.default.findOne({
            title,
            createdBy: currentUser.id,
        });
        if (isRoleExist && isRoleExist._id.toString() !== id) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("roleValidationMessages.response.updateRole.exist"),
            });
        }
        const role = await RoleModel_1.default.findByIdAndUpdate(id, { title, description }, { new: true });
        if (!role) {
            return res.status(200).json({ success: false, message: req.i18n.t("roleValidationMessages.response.notFound") });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("roleValidationMessages.response.updateRole.success"),
            data: role,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: req.i18n.t("roleValidationMessages.response.updateRole.server"),
            error: error.message,
        });
    }
};
exports.updateRole = updateRole;
// Delete a role by ID
const deleteRole = async (req, res) => {
    try {
        const role = await RoleModel_1.default.findByIdAndUpdate(req.params.id, {
            isTrash: true,
        }, {
            runValidators: true,
        });
        if (!role) {
            return res.status(200).json({ success: false, message: req.i18n.t("roleValidationMessages.response.notFound") });
        }
        return res
            .status(200)
            .json({ success: true, message: req.i18n.t("roleValidationMessages.response.deleteRoleById.success") });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: req.i18n.t("roleValidationMessages.response.deleteRoleById.success"),
            error: error.message,
        });
    }
};
exports.deleteRole = deleteRole;
