import mongoose from 'mongoose';

export const connectDB = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.TESTDB_URI as string);
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
};

export const clearDB = async () => {
  const collections = await mongoose.connection.db.collections();
  for (const k of collections) {
    await k.deleteMany({});
  }
};
