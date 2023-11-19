import dotenv from 'dotenv';
dotenv.config({ path: './.env.test' });
import { createLogger } from '../../app/utils/helperFN';
import { connectDB, disconnectDB, clearDB } from './db';
import { UserFactory } from './db/factory';
const log = createLogger('TesetSetup');

beforeAll(async () => {
  await connectDB();
  await UserFactory.seedUsersAndClients();
});

afterAll(async () => {
  log.info('Disconnecting Test DB afterAll...');
  await clearDB();
  await disconnectDB();
});
