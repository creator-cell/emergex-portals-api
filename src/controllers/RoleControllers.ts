import { Request, Response } from "express";
import RoleModel from "../models/RoleModel";
import { getPaginationOptions, paginate } from "../helper/pagination";

// Create a new role
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const isExist = await RoleModel.findOne({ name });
    if (isExist) {
      return res.status(201).json({
        success: false,
        message: req.i18n.t("roleValidationMessages.response.createRole.exist"),
      });
    }
    const newRole = new RoleModel({ name });
    await newRole.save();
    return res.status(201).json({
      success: true,
      message: req.i18n.t("roleValidationMessages.response.createRole.success"),
      data: newRole,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t("roleValidationMessages.response.createRole.server"),
    });
  }
};

// Get all roles
export const getRoles = async (req: Request, res: Response) => {
  try {
    // const roles = await RoleModel.find();
    const options = getPaginationOptions(req, {
      populate: [],
      sort: { createdAt: -1 }
    });
    const result = await paginate(RoleModel, options);
    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "roleValidationMessages.response.getAllRoles.success"
      ),
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t("roleValidationMessages.response.getAllRoles.server"),
    });
  }
};

// Get a role by ID
export const getRoleById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const role = await RoleModel.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: req.i18n.t(
          "roleValidationMessages.response.getRoleById.notFound"
        ),
      });
    }
    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "roleValidationMessages.response.getRoleById.success"
      ),
      data: role,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t("roleValidationMessages.response.getRoleById.server"),
    });
  }
};

// Update a role
export const updateRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const role = await RoleModel.findByIdAndUpdate(id, { name }, { new: true });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: req.i18n.t(
          "roleValidationMessages.response.updateRoleById.notFound"
        ),
      });
    }
    return res
      .status(200)
      .json({
        success: true,
        message: req.i18n.t(
          "roleValidationMessages.response.updateRoleById.success"
        ),
        data: role,
      });
  } catch (error: any) {
    return res
      .status(500)
      .json({
        success: false,
        error: req.i18n.t(
          "roleValidationMessages.response.updateRoleById.server"
        ),
      });
  }
};

// Delete a role
export const deleteRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const role = await RoleModel.findByIdAndDelete(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: req.i18n.t(
          "roleValidationMessages.response.deleteRoleById.notFound"
        ),
      });
    }
    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "roleValidationMessages.response.deleteRoleById.success"
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "roleValidationMessages.response.deleteRoleById.server"
      ),
    });
  }
};
