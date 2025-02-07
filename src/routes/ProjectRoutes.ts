import express from "express";
import {
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getAllProjects,
  createProjectByName,
  getProjectsByLocation,
  getAllEmployeesInProjectOrganization,
} from "../controllers/ProjectControllers";

import {
  createProjectValidation,
  updateProjectValidation,
  getProjectByIdValidation,
  createProjectByNameValidation,
  projectByLocationValidation,
} from "../validations/projectValidators";

import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";

const router = express.Router();

router.post(
  "/create-project",
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  createProjectByNameValidation,
  checkValidationResult,
  createProjectByName
);

router
  .route("/")
  .post(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
    createProjectValidation,
    checkValidationResult,
    createProject
  )
  .get(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
    getAllProjects
  );

router
  .route("/project-by-id/:id")
  .get(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
    getProjectByIdValidation,
    checkValidationResult,
    getProjectById
  )
  .put(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    updateProjectValidation,
    checkValidationResult,
    updateProject
  )
  .delete(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    getProjectByIdValidation,
    checkValidationResult,
    deleteProject
  );

router.get(
  "/project-by-location",
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  projectByLocationValidation,
  checkValidationResult,
  getProjectsByLocation
);

router.get(
  "/employees-in-project-organization/:id",
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  getProjectByIdValidation,
  checkValidationResult,
  getAllEmployeesInProjectOrganization
);

export default router;
