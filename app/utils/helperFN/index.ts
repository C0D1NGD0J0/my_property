import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import bunyan from 'bunyan';
import { IPaginateResult } from '@interfaces/utils.interface';
import { isValidObjectId } from 'mongoose';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@utils/constants';

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

  const atoken = jwt.sign({ id }, secrets[0], {
    expiresIn: process.env.JWT_EXPIREIN,
  });

  const rtoken = jwt.sign({ id }, secrets[1], {
    expiresIn: process.env.JWT_REFRESH_EXPIRESIN,
  });

  return {
    refreshToken: `Bearer ${rtoken}`,
    accessToken: `Bearer ${atoken}`,
  };
};

export const setCookieAuth = (
  tokens: { rtoken?: string; atoken: string },
  res: Response
) => {
  const options = {
    httpOnly: true,
    expire: 7200, // Expires after 2hr
    path: '/',
    sameSite: true,
    secure: process.env.NODE_ENV === 'production', //only works with https
  };

  if (!tokens || (!tokens.rtoken && !tokens.atoken)) {
    throw new Error('Error setting cookies.');
  }

  if (tokens?.rtoken) {
    res.cookie(REFRESH_TOKEN, tokens.rtoken, options);
  }

  if (tokens.atoken) {
    res.cookie(ACCESS_TOKEN, tokens.atoken, options);
  }
  return res;
};

export const paginateResult = (count: number, skip: number, limit: number) => {
  const result: IPaginateResult = {
    total: count,
    perPage: limit,
    currentPage: Math.floor(skip / limit) + 1,
    totalPages: Math.ceil(count / limit),
    hasMoreResource: false,
  };

  result.hasMoreResource = count - result.currentPage * limit > 0;
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
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}[0-9a-fA-F]?$/i;
  let obj;

  if (id.length === 24 && isValidObjectId(id)) {
    obj = { isValid: true, type: 'mongoID' };
  } else if (id.length > 32 && regexExp.test(id)) {
    obj = { isValid: true, type: 'uuid' };
  } else {
    obj = { isValid: false };
  }
  return obj;
};

export const mergeArrayWithLimit = (
  limit = 5,
  originalArray: any[],
  newArray: any[]
) => {
  // Determine the number of items to be removed to accommodate the incoming data
  const numItemsToRemove = Math.max(
    0,
    originalArray.length + newArray.length - limit
  );
  // Remove the necessary number of items from the beginning of the internal array
  const removedItems = originalArray.splice(0, numItemsToRemove);
  // Merge the incoming data with the internal array
  originalArray.push(...newArray);
  // Return the removed items
  return { data: originalArray, removedItems };
};

export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber) {
    return false;
  }
  // Regular expressions for various phone number formats
  const usCanadaRegex =
    /^(\+\d{1,2}\s?)?1?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  const europeRegex = /^(\+3[0-9]|4[0-46-9]|5[1-8]|7[1-79])?\d{6,14}$/; // General Europe
  const africaRegex = /^(\+2[0-46-8])?\d{6,14}$/; // General Africa

  return (
    usCanadaRegex.test(phoneNumber.trim()) ||
    europeRegex.test(phoneNumber.trim()) ||
    africaRegex.test(phoneNumber.trim())
  );
};
