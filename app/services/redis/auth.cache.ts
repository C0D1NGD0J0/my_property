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

  saveToken = async (
    userid: string,
    token: string
  ): Promise<ICacheResponse> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      return await this.setObject('authTokens', {
        [userid]: token,
      });
    } catch (error) {
      this.log.error('Auth cache error: ', error);
      throw {
        msg: error.message,
        errorType: 'cacheError',
      };
    }
  };

  getToken = async (
    userid: string
  ): Promise<ICacheResponse<{ accessToken: string; jwtToken: string }>> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      return await this.getObjectField('authTokens', userid);
    } catch (error) {
      this.log.error('Auth cache error: ', error);
      throw {
        msg: error.message,
        errorType: 'authError',
      };
    }
  };
}
