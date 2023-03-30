import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import bunyan from 'bunyan';
import { IPaginateResult } from '@interfaces/utils.interface';
import { isValidObjectId } from 'mongoose';

export const hashGenerator = (): string => {
  const token = crypto.randomBytes(10).toString('hex');
  // Hashing of token
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const jwtGenerator = (id: string) => {
  const secrets = [
    process.env.JWT_SECRET as string,
    process.env.JWT_REFRESH_SECRET as string,
  ];

  return {
    refreshToken: `Bearer ${jwt.sign({ id }, secrets[1], {
      expiresIn: process.env.JWT_REFRESH_EXPIRESIN,
    })}`,
    accessToken: `Bearer ${jwt.sign({ id }, secrets[0], {
      expiresIn: process.env.JWT_EXPIREIN,
    })}`,
  };
};

export const setCookieAuth = (token: string, res: Response) => {
  const options = {
    httpOnly: true,
    maxAge: 7200, // Expires after 2hr
    path: '/',
    secure: process.env.NODE_ENV === 'production', //only works with https
  };

  res.cookie('refreshToken', token, options);
  return res;
};

export const paginateResult = (count: number, skip: number, limit: number) => {
  const result: IPaginateResult = {
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

export const validateResourceID = (id: string) => {
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

  if (id.length == 24 && isValidObjectId(id)) {
    return { isValid: true };
  } else if (id.length > 32 && regexExp.test(id)) {
    return { isValid: true };
  } else {
    return { isValid: false };
  }
};
