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
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  }
};

export const clearDB = async () => {
  if (mongod) {
    const collections = mongoose.connection.collections;
    for (const k in collections) {
      const _collection = collections[k];
      await _collection.deleteMany({});
    }
  }
};
