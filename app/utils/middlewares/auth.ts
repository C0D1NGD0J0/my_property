/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk';
import jwt from 'jsonwebtoken';
import { NextFunction } from 'express';

import { asyncHandler } from '.';
import User from '../../models/user.model';
import { AuthCache } from '@services/redis';
import ErrorResponse from '../errorResponse';
import { AppRequest, AppResponse } from '../../interfaces/utils.interface';

const authCache: AuthCache = new AuthCache();

export const isAuthenticated = asyncHandler(
  async (req: AppRequest, res: AppResponse, next: NextFunction) => {
    // let token = req.cookies['access-token'];
    let token = '';

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ErrorResponse('Access denied!', 'jwtError', 403));
    }

    try {
      const decoded = <any>jwt.verify(token, process.env.JWT_SECRET as string);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        throw new ErrorResponse(
          'Please validate your email by clicking the link emailed during regitration process.',
          'authServiceError',
          422
        );
      }

      req.currentuser = user;
      next();
    } catch (error: Error | any) {
      console.log(chalk.red.bold(error), '---middleware---');
      return next(error);
    }
  }
);
