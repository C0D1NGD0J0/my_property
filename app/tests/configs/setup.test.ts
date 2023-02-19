import dotenv from 'dotenv';
dotenv.config({ path: './.env.test' });
import { createLogger } from '../../utils/helperFN';
import { connectDB, disconnectDB, clearDB } from './db';

const log = createLogger('TesetSetup');

beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  return await clearDB();
});

afterAll(async () => {
  log.info('Disconnecting Test DB afterAll...');
  return await disconnectDB();
});
