import express from 'express';
import { sendMessage, fetchMessages } from '../controllers/MessageControllers';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';

const router = express.Router();

router.route('/').post(sendMessage);
router.route('/:chatId').get(fetchMessages);

router.use(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin));

export default router;
