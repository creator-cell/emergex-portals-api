"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const projectOrganizationChartSchema = new mongoose_1.Schema({
    project: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Project'
    },
    from: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    to: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    team: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Team'
    },
    employee: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    priority: {
        type: Number,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
const ProjectOrganizationChartModel = (0, mongoose_1.model)("Project_Organization_Chart", projectOrganizationChartSchema);
exports.default = ProjectOrganizationChartModel;
