"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProjectOrganizationChart = void 0;
const ProjectOrganizationChartModel_1 = __importDefault(require("../models/ProjectOrganizationChartModel"));
const EmployeeModel_1 = __importDefault(require("../models/EmployeeModel"));
const addProjectOrganizationChart = async (req, res) => {
    try {
        const { project, from, to, team, employee } = req.body;
        const existingCharts = await ProjectOrganizationChartModel_1.default.find({ project });
        if (!project) {
            return res.status(200).json({
                success: false,
                error: "Project not exist with id: "
            });
        }
        let priority;
        if (!from && !to) {
            priority = 1;
        }
        if (from && !to) {
            const isFromEmployeeExist = await EmployeeModel_1.default.findById(from);
            if (!isFromEmployeeExist) {
                return res.status(200).json({
                    success: "Employee not exist with id: "
                });
            }
            const isFromExistInCurrentProjectChart = existingCharts.some((chart) => chart.employee === from);
            if (!isFromExistInCurrentProjectChart) {
                return res.status(200).json({
                    success: "From Employee not exist in project chart"
                });
            }
            existingCharts.forEach((chart) => {
                if (chart.employee === from) {
                    priority = chart.priority + 1;
                }
            });
        }
        if (from && to) {
            let fromPriority;
            let toPriority;
            existingCharts.forEach((chart) => {
                if (chart.employee === from) {
                    fromPriority = chart.priority + 1;
                }
            });
            existingCharts.forEach((chart) => {
                if (chart.employee === to) {
                    toPriority = chart.priority - 1;
                }
            });
            if (fromPriority !== toPriority) {
                throw new Error("Error in settling priority in project organization chart");
            }
            priority = fromPriority;
        }
        if (existingCharts.length > 0) {
            if (from && !to) {
                const maxPriority = Math.max(...existingCharts.map(chart => chart.priority || 0));
                priority = maxPriority + 1;
            }
            else if (from && to) {
                const fromPriority = Math.max(...existingCharts.map(chart => chart.priority || 0)) + 1;
                const toPriority = fromPriority - 2;
                await ProjectOrganizationChartModel_1.default.updateMany({ project, employee: to }, { $inc: { priority: -1 } });
                priority = fromPriority;
            }
        }
        const newChart = new ProjectOrganizationChartModel_1.default({
            project,
            from,
            to,
            team,
            employee,
            priority
        });
        await newChart.save();
        res.status(201).json({ success: true, message: "Project Organization Chart added successfully", data: newChart });
    }
    catch (error) {
        console.error("Error adding Project Organization Chart:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};
exports.addProjectOrganizationChart = addProjectOrganizationChart;
