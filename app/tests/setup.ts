import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

beforeAll((done) => {
  if (mongoose.connection.readyState === 1) {
    return done();
  }
  mongoose.connect(process.env.TESTDB_URI as string, done);
  return console.log('Connected to test database');
});

afterAll((done) => {
  mongoose.connection.db.dropDatabase(() => {
    mongoose.connection.close(() => done());
  });
});
