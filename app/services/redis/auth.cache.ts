import { createLogger } from '@utils/helperFN';
import { BaseCache, ICacheResponse } from '@services/redis/base.cache';

export default class AuthCache extends BaseCache {
  private ttl = 3000;
  private authPrefix = {
    refreshToken: 'refreshToken',
  };

  constructor() {
    super('authCache');
    this.log = createLogger('authCache');
  }

  setRefreshToken = async (
    userid: string,
    refreshToken: string
  ): Promise<ICacheResponse> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      return await this.setObject('refreshTokens', { [userid]: refreshToken });
    } catch (error) {
      this.log.error('Auth cache error: ', error);
      throw {
        msg: error.message,
        errorType: 'cacheError',
      };
    }
  };

  getRefreshToken = async (userid: string) => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      return await this.getObjectField('refreshTokens', userid);
    } catch (error) {
      this.log.error('Auth cache error: ', error);
      throw {
        msg: error.message,
        errorType: 'authError',
      };
    }
  };
}
