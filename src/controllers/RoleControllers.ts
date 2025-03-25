// controllers/roleController.ts
import { Request, Response } from "express";
import RoleModel, { IRole } from "../models/RoleModel";
import { ICustomRequest } from "../types/express";

// Create a new role
export const createRole = async (
  req: Request,
  res: Response
) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { title, description } = req.body;

    const isRoleExist = await RoleModel.findOne({
      title,
      createdBy: currentUser.id,
    });
    if (isRoleExist) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t("roleValidationMessages.response.createRole.exist"),
      });
    }

    const role: IRole = new RoleModel({
      title,
      description,
      createdBy: currentUser.id,
    });
    await role.save();

    return res
      .status(201)
      .json({ success: true, message:req.i18n.t("roleValidationMessages.response.createRole.success"), role });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:req.i18n.t("roleValidationMessages.response.createRole.server"),
      error: error.message,
    });
  }
};

// Get all roles
export const getAllRoles = async (
  req: Request,
  res: Response
) => {
  try {
    const customReq = req as ICustomRequest;
    const currentUser = customReq.user;
    const roles: IRole[] = await RoleModel.find({isTrash:false});
   return res.status(200).json({
      success: true,
      data: roles,
      messsage: req.i18n.t("roleValidationMessages.response.getAllRoles.success"),
    });
  } catch (error: any) {
   return res.status(500).json({
      success: false,
      message: req.i18n.t("roleValidationMessages.response.getAllRoles.server"),
      error: error.message,
    });
  }
};

// Get a single role by ID
export const getRoleById = async (
  req: Request,
  res: Response
) => {
  try {
    const role: IRole | null = await RoleModel.findById(req.params.id);
    if (!role) {
     return res.status(200).json({ success: false, message: req.i18n.t("roleValidationMessages.response.notFound") });
    }
   return res.status(200).json({
      success: true,
      data: role,
      message: req.i18n.t("roleValidationMessages.response.getRoleById.success"),
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: req.i18n.t("roleValidationMessages.response.getRoleById.server"), error: error.message });
  }
};

// Update a role by ID
export const updateRole = async (
  req: Request,
  res: Response
)=> {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { title, description } = req.body;
    const { id } = req.params;

    const isRoleExist = await RoleModel.findOne({
      title,
      createdBy: currentUser.id,
    });
    if (isRoleExist && isRoleExist._id.toString() !== id) {
     return res.status(200).json({
        success: false,
        error: req.i18n.t("roleValidationMessages.response.updateRole.exist"),
      });
    }

    const role: IRole | null = await RoleModel.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );

    if (!role) {
     return res.status(200).json({ success: false, message: req.i18n.t("roleValidationMessages.response.notFound") });
    }

   return res.status(200).json({
      success: true,
      message: req.i18n.t("roleValidationMessages.response.updateRole.success"),
      data: role,
    });
  } catch (error: any) {
   return res.status(500).json({
      success: false,
      message:  req.i18n.t("roleValidationMessages.response.updateRole.server"),
      error: error.message,
    });
  }
};

// Delete a role by ID
export const deleteRole = async (
  req: Request,
  res: Response
) => {
  try {
    const role: IRole | null = await RoleModel.findByIdAndUpdate(
      req.params.id,
      {
        isTrash: true,
      },
      {
        runValidators: true,
      }
    );

    if (!role) {
     return res.status(200).json({ success: false, message: req.i18n.t("roleValidationMessages.response.notFound") });
    }

    return res
      .status(200)
      .json({ success: true, message: req.i18n.t("roleValidationMessages.response.deleteRoleById.success") });
  } catch (error: any) {
    return res
      .status(500)
      .json({
        success: false,
        message: req.i18n.t("roleValidationMessages.response.deleteRoleById.success"),
        error: error.message,
      });
  }
};
