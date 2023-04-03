import { body, param } from 'express-validator';

import { Client, Property } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import { validateResourceID } from '@utils/helperFN';
import { errorTypes, httpStatusCodes } from '@utils/constants';

export const validatePropertyParams = () => {
  return [
    param('pid', 'Property resource identifier missing.')
      .if(param('pid').exists())
      .bail()
      .custom(async (pid) => {
        const { isValid } = validateResourceID(pid);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid resource identifier provided <${pid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }

        const property = await Property.findOne({ pid });
        if (!property) {
          throw new ErrorResponse(
            `Invalid Property resource identifier provided <${pid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
    param('cid', 'Client identifier missing.')
      .if(param('cid').exists())
      .bail()
      .custom(async (cid) => {
        const { isValid } = validateResourceID(cid);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid identifier provided <${cid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.BAD_REQUEST
          );
        }

        const client = await Client.findOne({ cid });
        if (!client) {
          throw new ErrorResponse(
            `Invalid Client resource identifier provided <${cid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
  ];
};

export const validateClientParams = () => {
  return [
    param('cid', 'Client identifier missing.')
      .if(param('cid').exists())
      .bail()
      .custom(async (cid) => {
        const { isValid } = validateResourceID(cid);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid identifier provided <${cid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.BAD_REQUEST
          );
        }

        const client = await Client.findOne({ cid });
        if (!client) {
          throw new ErrorResponse(
            `Invalid Client resource identifier provided <${cid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
  ];
};
