import { createLogger } from '@utils/helperFN';
import { BaseCache } from '@root/app/caching/base.cache';

const log = createLogger('redisConnection');

class RedisConnection extends BaseCache {
  constructor() {
    super('redisConnection');
  }

  async connect(): Promise<void> {
    try {
      this.client.connect();
      this.client.on('connect', () => {
        log.info(`Redis connection established`);
      });
      this.client.on('error', (error) => {
        log.error('Redis connection error: ', error);
      });
    } catch (error) {
      this.log.error(error);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
