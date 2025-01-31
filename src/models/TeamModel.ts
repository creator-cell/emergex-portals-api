import mongoose, { Schema,Document, Model, model } from 'mongoose';

export interface ITeam extends Document{
    name:string;
    members:mongoose.Types.ObjectId[],
    isDeleted:boolean;
}

const TeamSchema = new Schema<ITeam>({
    name:{
        type:String,
        trim:true,
        unique:true,
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
    }
},{
    timestamps:true
})

const TeamModel:Model<ITeam> = mongoose.model<ITeam>('Team',TeamSchema);

export default TeamModel;