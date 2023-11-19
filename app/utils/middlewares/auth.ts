/* eslint-disable @typescript-eslint/no-explicit-any */
import colors from 'colors';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { NextFunction } from 'express';

import { asyncHandler } from '.';
import ErrorResponse from '../errorResponse';
import { AuthCache } from '@root/app/caching';

import { UserService } from '@services/user';
import { AuthController } from '@controllers/index';
import { ICurrentUser } from '@interfaces/user.interface';
import { IUserDocument } from '@interfaces/user.interface';
import { errorTypes, httpStatusCodes, REFRESH_TOKEN } from '@utils/constants';
import { AppRequest, AppResponse } from '../../interfaces/utils.interface';

class AuthMiddlewares {
  private authCache: AuthCache;
  private userService: UserService;

  constructor() {
    this.authCache = new AuthCache();
    this.userService = new UserService();
  }

  isAuthenticated = asyncHandler(
    async (req: AppRequest, res: AppResponse, next: NextFunction) => {
      let token = req.cookies.accessToken;
      const cid = req.params.cid || req.cookies.clientId;
      if (token && token.startsWith('Bearer')) {
        token = token.split(' ')[1];
      }

      if (!token) {
        return next(
          new ErrorResponse(
            'Access denied!',
            errorTypes.AUTH_ERROR,
            httpStatusCodes.UNAUTHORIZED
          )
        );
      }

      try {
        const decoded = <any>(
          jwt.verify(token, process.env.JWT_SECRET as string)
        );

        const resp = await this.authCache.getCurrentUser(decoded.id);
        if (!resp.data) {
          // no currentuser object in cache,
          const { data: _cuser } = await this.userService.getCurrentUser(
            cid,
            decoded.id
          );

          _cuser && (await this.authCache.saveCurrentUser(_cuser));
          req.currentuser = _cuser;
          return next();
        }

        req.currentuser = resp.data as ICurrentUser;
        next();
      } catch (error: Error | any) {
        if (error instanceof jwt.TokenExpiredError) {
          return next(
            new ErrorResponse(
              'Token expired, please login again.',
              errorTypes.AUTH_ERROR,
              httpStatusCodes.UNAUTHORIZED
            )
          );
        } else if (error instanceof jwt.JsonWebTokenError) {
          return next(
            new ErrorResponse(
              'Invalid token, please login.',
              errorTypes.AUTH_ERROR,
              httpStatusCodes.FORBIDDEN
            )
          );
        }
        next(error);
      }
    }
  );
}

export default new AuthMiddlewares();
