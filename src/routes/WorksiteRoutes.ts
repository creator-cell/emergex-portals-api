import { Router } from 'express';
import { 
  addWorksite, 
  getAllWorksites, 
  getWorksitesByRegion,
  deleteWorksiteById,
  updateWorksiteById,
  getWorksiteById,
  addCountryRegionWorksites
} from '../controllers/WorksiteControllers';
import { getWorksitesByRegionValidation, updateWorksiteByIdValidation, validateCountryRegionWorksites, validateWorksite, worksitesByIdValidation } from '../validations/worksiteValidator';
import { checkValidationResult } from '../middlewares/checkValidationsMiddleware';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';

const router = Router();

router.route('/')
.post( authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),validateWorksite,checkValidationResult,addWorksite)
.get( authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),getAllWorksites);

router.get('/worksite-by-region-id/:id',  authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),getWorksitesByRegionValidation,checkValidationResult,getWorksitesByRegion);

router.route('/worksite-by-id/:id')
.get( authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),worksitesByIdValidation,checkValidationResult,getWorksiteById)
.put( authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),updateWorksiteByIdValidation,checkValidationResult,updateWorksiteById)
.delete( authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),worksitesByIdValidation,checkValidationResult,deleteWorksiteById);

router.post("/add-workplaces",authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),validateCountryRegionWorksites,checkValidationResult,addCountryRegionWorksites)

export default router;
