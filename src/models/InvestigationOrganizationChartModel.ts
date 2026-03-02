import mongoose, { Model, model, Schema } from 'mongoose';

export interface IInvestigationOrganizationChart {
    project: mongoose.Types.ObjectId;
    incident?: mongoose.Types.ObjectId;
    from?: mongoose.Types.ObjectId;
    to?: mongoose.Types.ObjectId;
    team?: mongoose.Types.ObjectId;
    employee: mongoose.Types.ObjectId;
    role: mongoose.Types.ObjectId;
    priority?: number;
    isDeleted?: boolean;
}

const investigationOrganizationChartSchema: Schema<IInvestigationOrganizationChart> = new Schema<IInvestigationOrganizationChart>({
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    incident: {
        type: Schema.Types.ObjectId,
        ref: 'Incident'
    },
    from: {
        type: Schema.Types.ObjectId,
        ref: 'Employee'
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: 'Employee'
    },
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team'
    },
    employee: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    priority: {
        type: Number,
        default: 1
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const InvestigationOrganizationChartModel: Model<IInvestigationOrganizationChart> = model<IInvestigationOrganizationChart>("Investigation_Organization_Chart", investigationOrganizationChartSchema);

export default InvestigationOrganizationChartModel;
