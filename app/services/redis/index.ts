import { createLogger } from '@utils/helperFN';
import { BaseCache } from '@services/redis/base.cache';

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
    } catch (error) {
      this.log.error(error);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
