/* eslint-disable @typescript-eslint/no-explicit-any */
import { asyncHandler } from '.';
import { NextFunction } from 'express';
import ErrorResponse from '../errorResponse';
import User from '../../models/user.model';
import jwt from 'jsonwebtoken';
import chalk from 'chalk';
import { AppRequest, AppResponse } from '../../interfaces/utils.interface';

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
      return next(new ErrorResponse('Access denied!', 403, 'jwtError'));
    }

    try {
      const decoded = <any>jwt.verify(token, process.env.JWT_SECRET as string);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        throw new ErrorResponse(
          'Please validate your email by clicking the link emailed during regitration process.',
          422,
          'authServiceError'
        );
      }

      req.currentuser = user;
      next();
    } catch (error: unknown | any) {
      console.log(chalk.red.bold(error), '---middleware---');
      return next(error);
    }
  }
);
