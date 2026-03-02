import express from "express";
import { getInvestigationOrgChart, addInvestigationOrgChart } from "../controllers/InvestigationOrganizationChartControllers";

const router = express.Router();

router.get('/:id', getInvestigationOrgChart);

router.put('/:id', addInvestigationOrgChart);

export default router;
