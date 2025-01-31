import mongoose from 'mongoose';
import {config} from './index'

const connectDB = async ():Promise<void> => {
  try {
    await mongoose.connect(config.dbConnectionString);
    console.log('MongoDB connected: ',mongoose.connection.host);
    
  } catch (error:any) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
