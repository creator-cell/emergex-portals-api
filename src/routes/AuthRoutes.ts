import express from 'express';
import {register, login, changePassword} from '../controllers/AuthContollers';
import { validateLogin, validateRegister } from '../validations/authValidators';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';
import { checkValidationResult } from '../middlewares/checkValidationsMiddleware';

const router = express.Router();

router.post('/register',authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),validateRegister, checkValidationResult,register);
router.post('/login', validateLogin,checkValidationResult,login);

router.put('/change-password',authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),changePassword)

export default router;
