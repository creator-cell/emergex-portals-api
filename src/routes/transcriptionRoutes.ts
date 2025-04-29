import express from 'express';
const router = express.Router();

import { handleTranscription } from '../controllers/transcriptionController';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';

router.post('/', handleTranscription);

router.use(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin))

export default router;