import colors from 'colors';
import logger from 'bunyan';
import { createClient } from 'redis';
import { createLogger } from '@utils/helperFN';

export type RedisClient = ReturnType<typeof createClient>;

export interface ICacheResponse<T = undefined> {
  success: boolean;
  data?: T;
}

export abstract class BaseCache {
  client: RedisClient;
  log: logger;

  constructor(cacheName: string) {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });
    this.log = createLogger(cacheName, true);
    this.cacheError();
  }

  setItem = async (
    key: string,
    value: string,
    ttl = 120
  ): Promise<ICacheResponse> => {
    try {
      let resp;

      if (ttl) {
        resp = await this.client.SETEX(key, ttl, value);
      } else {
        resp = await this.client.SET(key, value);
      }

      if (resp !== 'OK' || !resp) {
        this.log.error('Error saving item to cache');
        return { success: false };
      }
      return { success: true };
    } catch (error) {
      this.log.error('Error setting item in cache', error.message);
      throw error;
    }
  };

  getItem = async (key: string): Promise<ICacheResponse<string | null>> => {
    try {
      const resp = await this.client.GET(key);
      return { success: true, data: resp };
    } catch (error) {
      this.log.error(error.message);
      throw error;
    }
  };

  setObject = async (
    objName: string,
    data: object
  ): Promise<ICacheResponse> => {
    try {
      if (!objName) throw new Error('Error save to cache: objName is required');
      let resp;

      for (const [key, value] of Object.entries(data)) {
        resp = await this.client.HSET(objName, key, JSON.stringify(value));
      }

      return { success: !!resp };
    } catch (error) {
      this.log.error(colors.red.bold(error));
      throw error;
    }
  };

  getObjectField = async (
    objName: string,
    key: string
  ): Promise<ICacheResponse<any>> => {
    try {
      if (!objName || !key) {
        throw new Error(
          'Error getting item from cache: check arguments provided.'
        );
      }

      const resp = await this.client.HGET(objName, key);
      return {
        success: true,
        data: (resp && JSON.parse(resp as string)) || null,
      };
    } catch (error) {
      this.log.error(colors.red.bold(error));
      throw error;
    }
  };

  delObjectField = async (
    objName: string,
    key: string
  ): Promise<ICacheResponse> => {
    try {
      if (!objName || !key) {
        throw new Error(
          'Error deleting item from cache: check arguments provided.'
        );
      }

      await this.client.HDEL(objName, key);
      return {
        success: true,
      };
    } catch (error) {
      this.log.error(colors.red.bold(error.message), '------');
      throw error;
    }
  };

  removeItem = async (key: string): Promise<ICacheResponse> => {
    try {
      const resp = await this.client.del(key);
      return { success: !!resp };
    } catch (error) {
      this.log.error(error);
      throw error;
    }
  };

  generateKey = (prefix: string, id: string): string => {
    return `${prefix}:${id}`;
  };

  private cacheError(): void {
    this.client.on('error', (err: unknown) => {
      this.log.error(err);
    });
  }
}
