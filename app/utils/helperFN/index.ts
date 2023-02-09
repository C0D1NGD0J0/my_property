import crypto from 'crypto';
import { Types } from 'mongoose';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';

const hashGenerator = (): string => {
  const token = crypto.randomBytes(10).toString('hex');
  // Hashing of token
  return crypto.createHash('sha256').update(token).digest('hex');
};

const jwtGenerator = (userId: Types.ObjectId, secret = process.env.JWT_SECRET as string, opts: SignOptions) => {
  return `Bearer ${jwt.sign({ id: userId }, secret, opts)}`;
};

const setCookieAuth = (refreshJWT: string, res: Response) => {
  const options = {
    httpOnly: true,
    maxAge: 7200, // Expires after 2hr
    path: '/',
    secure: process.env.NODE_ENV === 'production', //only works with https
  };

  res.cookie('authToken', refreshJWT, options);
  return res;
};

const paginateResult = (count: number, skip: number, limit: number) => {
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

export { jwtGenerator, hashGenerator, setCookieAuth, paginateResult };
