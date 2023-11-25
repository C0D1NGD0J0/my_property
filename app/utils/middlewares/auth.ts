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
import { createLogger } from '@utils/helperFN';
import { ACCESS_TOKEN } from '@utils/constants';

class AuthMiddlewares {
  private log;
  private authCache: AuthCache;
  private userService: UserService;

  constructor() {
    this.authCache = new AuthCache();
    this.userService = new UserService();
    this.log = createLogger('AuthMiddleware', true);
  }

  isAuthenticated = asyncHandler(
    async (req: AppRequest, res: AppResponse, next: NextFunction) => {
      let token = req.cookies.accessToken;
      const cid = req.params.cid || req.cookies.cid;
      if (token && token.startsWith('Bearer')) {
        token = token.split(' ')[1];
      }

      if (!cid) {
        return next(
          new ErrorResponse(
            'Access denied!',
            errorTypes.AUTH_ERROR,
            httpStatusCodes.UNAUTHORIZED
          )
        );
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
          // using 419 status code so on the frontend we can tract this specific code to trigger refresh-token process
          return next(
            new ErrorResponse(
              'Token expired, please login again.',
              errorTypes.AUTH_ERROR,
              httpStatusCodes.CUSTOM_UNAUTHORIZED
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

  initiateTokenRefresh = asyncHandler(
    async (req: AppRequest, res: AppResponse, next: NextFunction) => {
      let token = req.cookies.accessToken;
      const cid = req.params.cid || req.cookies.cid;
      if (token && token.startsWith('Bearer')) {
        token = token.split(' ')[1];
      }

      if (!cid) {
        return next(
          new ErrorResponse(
            'Access denied!',
            errorTypes.AUTH_ERROR,
            httpStatusCodes.UNAUTHORIZED
          )
        );
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
        jwt.verify(token, process.env.JWT_SECRET as string);
        return res
          .status(200)
          .send({ message: 'Access token is still valid.' });
      } catch (error: Error | any) {
        if (error instanceof jwt.TokenExpiredError) {
          // proceed to refresh token logic endpoint
          this.log.info('Auth middleware: refresh token regeneration');
          return next();
        } else if (error instanceof jwt.JsonWebTokenError) {
          this.log.error('Authentication error: jwt token error');
          return next(
            new ErrorResponse(
              'Please login again.',
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
