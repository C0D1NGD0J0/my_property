import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: any = null;
export const connectDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongod;
};

export const disconnectDB = async () => {
  if (mongod) {
    await mongod.stop();
    // await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  }
};

export const clearDB = async () => {
  if (mongod) {
    const collections = await mongoose.connection.db.collections();
    for (const k of collections) {
      await k.deleteMany({});
    }
  }
};
