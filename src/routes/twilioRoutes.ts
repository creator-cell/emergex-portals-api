import express from 'express';
import { generateTwilioTokenController, createVideoRoom, endVideoRoom } from '../controllers/twilioControllers';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';

const router = express.Router();

router.get('/token',generateTwilioTokenController);
router.post('/video-room',createVideoRoom);
router.post('/video-room/end',endVideoRoom);

router.use(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin));

export default router;