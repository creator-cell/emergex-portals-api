import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';
import {verifyToken} from '../controllers/UserControllers'

const router = express.Router();
router.get('/super-admin', authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin), (req, res) => {
  res.status(200).json({ message: 'Welcome, Super Admin!' });
});

router.get('/client-admin', authenticate, authorizeRoles('client-admin', 'super-admin'), (req, res) => {
  res.status(200).json({ message: 'Welcome, Client Admin!' });
});

router.get('/viewer', authenticate, (req, res) => {
  res.status(200).json({ message: 'Welcome, Viewer!' });
});

router.route('/verify-token').get(authenticate,verifyToken)

export default router
