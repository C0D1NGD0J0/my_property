import { createLogger } from '@utils/helperFN';
import { BaseCache, ICacheResponse } from '@services/redis/base.cache';

export default class AuthCache extends BaseCache {
  constructor() {
    super('authCache');
    this.log = createLogger('authCache');
  }

  saveAuthTokens = async (
    userid: string,
    tokens: [string, string]
  ): Promise<ICacheResponse> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (tokens.length !== 2) {
        throw new Error('Error adding token to cache.');
      }

      // tokens is array of jwt-token
      // tokens[0] = accessToken
      // tokena[1] = refreshToken
      return await this.setObject('authTokens', {
        [userid]: tokens,
      });
    } catch (error) {
      this.log.error('Auth cache error: ', error);
      throw {
        msg: error.message,
        errorType: 'cacheError',
      };
    }
  };

  getAuthTokens = async (
    userid: string
  ): Promise<ICacheResponse<[string, string]>> => {
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

  delAuthTokens = async (userid: string): Promise<ICacheResponse> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      return await this.delObjectField('authTokens', userid);
    } catch (error) {
      this.log.error('Auth cache error: ', error);
      throw {
        msg: error.message,
        errorType: 'authError',
      };
    }
  };
}
