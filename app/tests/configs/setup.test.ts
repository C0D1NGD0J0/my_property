import dotenv from 'dotenv';
dotenv.config({ path: './.env.test' });
import { createLogger } from '../../utils/helperFN';
import { connectDB, disconnectDB, clearDB } from './db';

const log = createLogger('TesetSetup');

beforeAll(async () => {
  await connectDB();
  log.info('Test Db connected...');
});

afterEach(async () => await clearDB());

afterAll(async () => await disconnectDB());
