import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  // updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/AnnouncementControllers';
import { validateAnnouncement, updateAnnouncementByIdValidation,getAnnouncementByIdValidation } from '../validations/accountmentValidators';
import { checkValidationResult } from '../middlewares/checkValidationsMiddleware';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';

const router = express.Router();

// Routes
router.route('/')
.post(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),validateAnnouncement, checkValidationResult, createAnnouncement)
.get(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),getAnnouncements);

router.route('/announcement-by-id/:id')
.get(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),getAnnouncementByIdValidation, checkValidationResult, getAnnouncementById)
// .put( updateAnnouncementByIdValidation,checkValidationResult, updateAnnouncement)
.delete(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),getAnnouncementByIdValidation, checkValidationResult, deleteAnnouncement);

export default router;
