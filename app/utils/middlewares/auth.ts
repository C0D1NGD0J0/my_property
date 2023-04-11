/* eslint-disable @typescript-eslint/no-explicit-any */
import colors from 'colors';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { NextFunction } from 'express';

import { asyncHandler } from '.';
import ErrorResponse from '../errorResponse';
import { AuthCache } from '@root/app/caching';
import User from '../../models/user/user.model';
import { AuthController } from '@controllers/index';
import { ICurrentUser } from '@interfaces/user.interface';
import { IUserDocument } from '@interfaces/user.interface';
import { mapCurrentUserObject } from '@services/user/utils';
import { errorTypes, httpStatusCodes, REFRESH_TOKEN } from '@utils/constants';
import { AppRequest, AppResponse } from '../../interfaces/utils.interface';

class AuthMiddlewares {
  private authCache: AuthCache;
  private authCntrl: typeof AuthController;

  constructor(authController: typeof AuthController) {
    this.authCache = new AuthCache();
    this.authCntrl = authController;
  }

  isAuthenticated = asyncHandler(
    async (req: AppRequest, res: AppResponse, next: NextFunction) => {
      let token = '';

      if (
        req.headers?.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
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
          // const user = await this.getUser(decoded.id);
          // await this.authCache.saveCurrentUser(user);
          // req.currentuser = user;
          // return next();
          await this.authCache.delAuthTokens(decoded.id);
          res.clearCookie(REFRESH_TOKEN);
          throw new ErrorResponse(
            'Access denied.',
            errorTypes.AUTH_ERROR,
            httpStatusCodes.UNAUTHORIZED
          );
        }

        req.currentuser = resp.data as ICurrentUser;
        next();
      } catch (error: Error | any) {
        if (error.name === 'TokenExpiredError') {
          return next(
            new ErrorResponse(
              'Access denied due to expired token.',
              errorTypes.AUTH_ERROR,
              httpStatusCodes.UNAUTHORIZED
            )
          );
        }
        next(error);
      }
    }
  );

  private getUser = async (id: string) => {
    const user = (await User.findOne({
      isActive: true,
      _id: new Types.ObjectId(id),
    })) as IUserDocument;

    if (!user) {
      throw new ErrorResponse(
        'Please validate your email by clicking the link emailed during regitration process.',
        errorTypes.NO_RESOURCE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }
    return mapCurrentUserObject(user);
  };
}

export default new AuthMiddlewares(AuthController);
