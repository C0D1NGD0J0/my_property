import mongoose from 'mongoose';
import { createLogger } from '@utils/helperFN';
import { redisConnection } from '@services/redis';
const isProduction = process.env.NODE_ENV === 'production';

class ConnectDB {
  private log;
  private static instance: ConnectDB;
  private connected = false;

  private constructor() {
    this.log = createLogger('DBConnection');
  }

  public static getInstance(): ConnectDB {
    if (!ConnectDB.instance) {
      ConnectDB.instance = new ConnectDB();
    }
    return ConnectDB.instance;
  }

  public async connect(): Promise<void> {
    if (this.connected) {
      return this.log.info('Database is already connected');
    }

    try {
      mongoose.set('strictQuery', true);
      isProduction
        ? mongoose.connect(process.env.MONGODB_URI as string)
        : await mongoose.connect(process.env.LOCALDB_URI as string);
      this.connected = true;
      redisConnection.connect();
      return this.log.info('Connected to database');
    } catch (err) {
      this.log.error('Database Connection Error: ', err);
      process.exit(1); //exit process with failure
    }
  }
}

export default ConnectDB.getInstance();
