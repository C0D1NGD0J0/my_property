import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

beforeAll((done) => {
  if (mongoose.connection.readyState === 1) {
    return done();
  }
  mongoose.connect(process.env.TESTDB_URI as string, done);
  return console.log('Connected to test database');
});

afterAll((done) => {
  mongoose.connection.dropDatabase(() => {
    mongoose.connection.close(() => done());
  });
});
