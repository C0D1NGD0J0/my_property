import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import bunyan from 'bunyan';

export const hashGenerator = (): string => {
  const token = crypto.randomBytes(10).toString('hex');
  // Hashing of token
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const jwtGenerator = (
  id: string,
  secret = process.env.JWT_SECRET as string,
  opts: SignOptions
) => {
  return `Bearer ${jwt.sign({ id }, secret, opts)}`;
};

export const setCookieAuth = (token: string, res: Response) => {
  const options = {
    httpOnly: true,
    maxAge: 7200, // Expires after 2hr
    path: '/',
    secure: process.env.NODE_ENV === 'production', //only works with https
  };

  res.cookie('access-token', token, options);
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

export const createLogger = (name: string, showsource = false): bunyan => {
  return bunyan.createLogger({
    name,
    src: showsource && process.env.NODE_ENV !== 'production',
    level: 'debug',
  });
};

export const range = (start: number, end: number, step: number): number[] => {
  if (!step) step = 1;
  const array = [];
  for (let i = start; i <= end; i += step) {
    array.push(i);
  }
  return array;
};

export const parseJSON = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};
