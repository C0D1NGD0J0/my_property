/* eslint-disable @typescript-eslint/no-explicit-any */
import colors from 'colors';
import jwt from 'jsonwebtoken';
import { NextFunction } from 'express';

import { asyncHandler } from '.';
import ErrorResponse from '../errorResponse';
import { AuthCache } from '@root/app/caching';
import User from '../../models/user/user.model';
import { IUserDocument } from '@interfaces/user.interface';
import { mapCurrentUserObject } from '@services/user/utils';
import { errorTypes, httpStatusCodes } from '@utils/constants';
import { AppRequest, AppResponse } from '../../interfaces/utils.interface';

const authCache: AuthCache = new AuthCache();

export const isAuthenticated = asyncHandler(
  async (req: AppRequest, _res: AppResponse, next: NextFunction) => {
    let token = '';

    if (
      req.headers.authorization &&
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
      const decoded = <any>jwt.verify(token, process.env.JWT_SECRET as string);
      const resp = await authCache.getCurrentUser(decoded.id);

      if (!resp.data) {
        const user = (await User.findOne({
          isActive: true,
          id: decoded.id,
        })) as IUserDocument;

        if (!user) {
          throw new ErrorResponse(
            'Please validate your email by clicking the link emailed during regitration process.',
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }

        req.currentuser = mapCurrentUserObject(user);
        return next();
      }

      req.currentuser = resp.data;
      next();
    } catch (error: Error | any) {
      console.log(colors.red.bold(error), '---middleware---');
      next(error);
    }
  }
);
