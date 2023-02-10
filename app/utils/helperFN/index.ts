import crypto from 'crypto';
import { Types } from 'mongoose';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import bunyan from 'bunyan';
import chalk from 'chalk';

export const hashGenerator = (): string => {
  const token = crypto.randomBytes(10).toString('hex');
  // Hashing of token
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const jwtGenerator = (
  userId: Types.ObjectId,
  secret = process.env.JWT_SECRET as string,
  opts: SignOptions
) => {
  return `Bearer ${jwt.sign({ id: userId }, secret, opts)}`;
};

export const setCookieAuth = (refreshJWT: string, res: Response) => {
  const options = {
    httpOnly: true,
    maxAge: 7200, // Expires after 2hr
    path: '/',
    secure: process.env.NODE_ENV === 'production', //only works with https
  };

  res.cookie('authToken', refreshJWT, options);
  return res;
};

export const paginateResult = (count: number, skip: number, limit: number) => {
  const result = {
    total: count,
    per_page: limit,
    current_page: Math.floor(skip / limit) + 1,
    total_pages: Math.ceil(count / limit),
    hasMoreResource: false,
  };

  result.hasMoreResource = count - result.current_page * limit > 0;
  return result;
};

export const createLogger = (name: string): bunyan => {
  return bunyan.createLogger({
    name,
    level: 'debug',
  });
};
