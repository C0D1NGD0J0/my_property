import fs from 'fs';
import crypto from 'crypto';
import csv from 'csv-parser';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import sanitizeHtml from 'sanitize-html';
import bunyan from 'bunyan';
import {
  IInvalidCsvProperties,
  IPaginateResult,
} from '@interfaces/utils.interface';
import { isValidObjectId } from 'mongoose';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@utils/constants';
import {
  IProperty,
  IPropertyCategoryEnum,
  IPropertyStatusEnum,
  IPropertyTypeEnum,
} from '@interfaces/property.interface';

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

export const parseAndValidatePropertiesCsv = async (
  filePath: string
): Promise<{
  validProperties: IProperty[];
  errors: null | IInvalidCsvProperties[];
}> => {
  const results: IProperty[] = [];
  const invalidProperties: IInvalidCsvProperties[] = [];
  let rowNumber = 1;

  const validateProperty = (
    property: IProperty
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate propertyType
    if (
      !Object.values(IPropertyTypeEnum).includes(
        property.propertyType as IPropertyTypeEnum
      )
    ) {
      errors.push(`Invalid propertyType: ${property.propertyType}`);
    }

    // Validate category
    if (
      !Object.values(IPropertyCategoryEnum).includes(
        property.category as IPropertyCategoryEnum
      )
    ) {
      errors.push(`Invalid category: ${property.category}`);
    }

    // Validate status
    if (
      !Object.values(IPropertyStatusEnum).includes(
        property.status as IPropertyStatusEnum
      )
    ) {
      errors.push(`Invalid status: ${property.status}`);
    }

    // Validate leaseType
    if (!['short-term', 'long-term', 'daily'].includes(property.leaseType)) {
      errors.push(`Invalid leaseType: ${property.leaseType}`);
    }

    // Validate fees.currency
    if (!['USD', 'CAD', 'EUR', 'GBP'].includes(property.fees.currency)) {
      errors.push(`Invalid currency: ${property.fees.currency}`);
    }

    // Validate property size
    if (
      typeof property.propertySize !== 'number' ||
      property.propertySize <= 0
    ) {
      errors.push(`Invalid property size: ${property.propertySize}`);
    }

    if (property.propertyType === IPropertyTypeEnum.singleFamily) {
      if (property.features.bedroom < 0 || property.features.bedroom > 10) {
        errors.push(
          `Bedrooms for a single-family property must be between 0 and 10`
        );
      }

      if (property.features.bathroom < 0 || property.features.bathroom > 10) {
        errors.push(
          `Bathrooms for a single-family property must be between 0 and 10`
        );
      }

      if (property.features.floors < 0 || property.features.floors > 5) {
        errors.push(
          `Floors for a single-family property must be between 0 and 5`
        );
      }

      // Assuming parking is part of features and should be validated similarly
      if (
        property.features.availableParking < 0 ||
        property.features.availableParking > 5
      ) {
        errors.push(
          `Parking spaces for a single-family property must be between 0 and 5`
        );
      }

      if (
        property.features.maxCapacity < 1 ||
        property.features.maxCapacity > 20
      ) {
        errors.push(
          `Max capacity for a single-family house must be between 1 and 20`
        );
      }
    }

    // Validate extras properties
    Object.entries(property.extras).forEach(([key, value]) => {
      if (typeof value !== 'boolean') {
        errors.push(`'${key}' must be true or false`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  if (!filePath) {
    throw new Error('Csv file path missing');
  }

  await new Promise((res, rej) => {
    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.replace(/_/, '.') }))
      .on('data', (data: any) => {
        const transformedData: IProperty = {
          title: data.title,
          description: {
            text: sanitizeHtml(data['description.text']),
            html: sanitizeHtml(data['description.html']),
          },
          propertyType: data.propertyType,
          status: data.status,
          managedBy: data.managedBy,
          propertySize: parseInt(data.propertySize, 10),
          features: {
            floors: data['features.floors'],
            bedroom: data['features.bedroom'],
            bathroom: data['features.bathroom'],
            maxCapacity: data['features.maxCapacity'],
            availableParking: data['features.availableParking'],
          },
          extras: {
            has_tv: data['extras.has_tv'].toLowerCase() === 'true',
            has_kitchen: data['extras.has_kitchen'].toLowerCase() === 'true',
            has_ac: data['extras.has_ac'].toLowerCase() === 'true',
            has_heating: data['extras.has_heating'].toLowerCase() === 'true',
            has_internet: data['extras.has_internet'].toLowerCase() === 'true',
            has_gym: data['extras.has_gym'].toLowerCase() === 'true',
            has_parking: data['extras.has_parking'].toLowerCase() === 'true',
            has_swimmingpool:
              data['extras.has_swimmingpool'].toLowerCase() === 'true',
            has_laundry: data['extras.has_laundry'].toLowerCase() === 'true',
            petsAllowed: data['extras.petsAllowed'].toLowerCase() === 'true',
          },
          category: data.category,
          address: data.address,
          fees: {
            taxAmount: parseInt(data['fees.taxAmount'], 10),
            includeTax: data['fees.includeTax'].toLowerCase() === 'true',
            rentalAmount: data['fees.rentalAmount'],
            currency: data['fees.currency'],
            managementFees: data['fees.managementFees'],
          },
          leaseType: data.leaseType,
          photos: data.photos
            ? [{ url: data.photos, filename: '', key: '' }]
            : [],
          totalUnits: data.totalUnits,
        };

        const { isValid, errors } = validateProperty(transformedData);

        if (isValid) {
          results.push(transformedData);
        } else {
          invalidProperties.push({
            address: transformedData.address,
            rowNumber,
            errors,
          });
        }

        rowNumber++;
      })
      .on('end', () => {
        console.log(`Successfully parsed ${results.length} valid properties.`);
        if (invalidProperties.length > 0) {
          console.log(
            `Invalid properties: ${invalidProperties.length} were not processed due to errors.`
          );
        }
        res(true);
      })
      .on('error', (error) => {
        console.error('Error parsing CSV:', error);
        rej(error);
      });
  });

  return {
    validProperties: results,
    errors: invalidProperties.length ? invalidProperties : null,
  };
};
