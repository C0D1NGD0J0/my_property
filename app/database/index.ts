import mongoose from 'mongoose';
import { createLogger } from '@utils/logger';
const isProduction = process.env.NODE_ENV === 'production';
const log: any = createLogger("DBConnection");

export const connectDB = async () => {
  try {
    if (isProduction) {
      mongoose.connect(process.env.MONGODB_URI as string);
      mongoose.set('strictQuery', true);
      return log.info('Connected to remote database');
    } else {
      mongoose.set('strictQuery', true);
      await mongoose.connect(process.env.LOCALDB_URI as string);
      // redisConnection.connect();
      return log.info('Connected to local database');
    }
  } catch (err) {
    log.error('Database Connection Error: ', err);
    process.exit(1); //exit process with failure
  }
};
