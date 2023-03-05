/* eslint-disable @typescript-eslint/no-explicit-any */
import colors from 'colors';
import jwt from 'jsonwebtoken';
import { NextFunction } from 'express';

import { asyncHandler } from '.';
import User from '../../models/user.model';
import { AuthCache } from '@services/redis';
import ErrorResponse from '../errorResponse';
import { AppRequest, AppResponse } from '../../interfaces/utils.interface';
import { httpStatusCodes } from '@utils/helperFN';

const authCache: AuthCache = new AuthCache();

export const isAuthenticated = asyncHandler(
  async (req: AppRequest, res: AppResponse, next: NextFunction) => {
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
          'jwtError',
          httpStatusCodes.UNAUTHORIZED
        )
      );
    }

    try {
      const decoded = <any>jwt.verify(token, process.env.JWT_SECRET as string);
      const redisToken = await authCache.getAuthTokens(decoded.id);

      if (!redisToken?.data || redisToken.data[0] !== token) {
        return next(
          new ErrorResponse(
            'Access denied!',
            'jwtError',
            httpStatusCodes.UNAUTHORIZED
          )
        );
      }

      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new ErrorResponse(
          'Please validate your email by clicking the link emailed during regitration process.',
          'authServiceError',
          httpStatusCodes.UNPROCESSABLE
        );
      }

      req.currentuser = user;
      next();
    } catch (error: Error | any) {
      console.log(colors.red.bold(error), '---middleware---');
      return next(error);
    }
  }
);
