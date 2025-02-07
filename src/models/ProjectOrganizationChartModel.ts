import mongoose, { Model, model, Schema } from 'mongoose';

export interface IProjectOrganizationChart {
    project:mongoose.Types.ObjectId;
    from:mongoose.Types.ObjectId;
    to:mongoose.Types.ObjectId;
    team:mongoose.Types.ObjectId;
    employee:mongoose.Types.ObjectId;
    priority?:number;
    isDeleted?:boolean;
}

const projectOrganizationChartSchema:Schema<IProjectOrganizationChart>= new Schema<IProjectOrganizationChart>({
    project:{
        type:Schema.Types.ObjectId,
        ref:'Project'
    },
    from:{
        type:Schema.Types.ObjectId,
        ref:'Employee'
    },
    to:{
        type:Schema.Types.ObjectId,
        ref:'Employee'
    },
    team:{
        type:Schema.Types.ObjectId,
        ref:'Team'
    },
    employee:{
        type:Schema.Types.ObjectId,
        ref:'Employee'
    },
    priority:{
        type:Number,
        required:true
    },
    isDeleted:{
        type:Boolean,
        default:false
    }
},{
    timestamps:true
})

const ProjectOrganizationChartModel:Model<IProjectOrganizationChart> = model<IProjectOrganizationChart>("Project_Organization_Chart",projectOrganizationChartSchema);
export default ProjectOrganizationChartModel;