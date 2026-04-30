import mongoose, { Schema,Document, Model, model } from 'mongoose';

export interface ITeam extends Document{
    name:string;
    members:mongoose.Types.ObjectId[],
    isDeleted:boolean;
    createdBy:mongoose.Types.ObjectId;
    companyId?: mongoose.Types.ObjectId;
}

const TeamSchema = new Schema<ITeam>({
    name:{
        type:String,
        trim:true,
        required:true,
    },
    members:{
        type:[Schema.Types.ObjectId],
        ref:'Employee',
        default:[],
    },
    isDeleted:{
        type:Boolean,
        default:false,
    },
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    companyId:{
        type:Schema.Types.ObjectId,
        ref:'Company',
    }
},{
    timestamps:true
})

TeamSchema.index({ name: 1, companyId: 1 }, { unique: true });

const TeamModel:Model<ITeam> = mongoose.model<ITeam>('Team',TeamSchema);

export default TeamModel;