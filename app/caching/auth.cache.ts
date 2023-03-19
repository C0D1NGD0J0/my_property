import { createLogger } from '@utils/helperFN';
import { BaseCache, ICacheResponse } from '@root/app/caching/base.cache';
import { ICurrentUser } from '@interfaces/user.interface';

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

  saveCurrentUser = async (data: ICurrentUser): Promise<ICacheResponse> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const key = this.generateKey('currentuser', data.id);
      return await this.setItem(key, JSON.stringify(data), 120);
    } catch (error) {
      this.log.error('Auth cache error: ', error);
      throw {
        msg: error.message,
        errorType: 'cacheError',
      };
    }
  };

  getCurrentUser = async (
    userId: string
  ): Promise<ICacheResponse<ICurrentUser | null>> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const key = this.generateKey('currentuser', userId);
      const resp = await this.getItem(key);

      let parsedData: ICurrentUser | null = null;
      if (resp.data) {
        parsedData = JSON.parse(resp.data);
      }

      return { success: true, data: parsedData };
    } catch (error) {
      this.log.error('Auth cache error: ', error);
      throw {
        msg: error.message,
        errorType: 'cacheError',
      };
    }
  };

  logoutUser = async (userId: string): Promise<ICacheResponse> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.removeItem(this.generateKey('currentuser', userId));
      await this.delObjectField('authTokens', userId);

      return { success: true };
    } catch (error) {
      this.log.error('Auth cache error: ', error);
      throw {
        msg: error.message,
        errorType: 'cacheError',
      };
    }
  };
}
