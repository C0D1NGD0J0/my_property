import { body, param } from 'express-validator';

import { Client, Property, Report } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import { validateResourceID } from '@utils/helperFN';
import { errorTypes, httpStatusCodes } from '@utils/constants';

const propertyParams = () => {
  return [
    param('puid', 'Property resource identifier missing.')
      .if(param('puid').exists())
      .bail()
      .custom(async (puid) => {
        const { isValid } = validateResourceID(puid);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid resource identifier provided <${puid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }

        const property = await Property.findOne({ puid });
        if (!property) {
          throw new ErrorResponse(
            `Invalid Property resource identifier provided <${puid}>.`,
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

const clientParams = () => {
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

const reportParams = () => {
  return [
    param('id', 'Report identifier missing.')
      .if(param('id').exists())
      .bail()
      .custom(async (id) => {
        const { isValid } = validateResourceID(id);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid identifier provided <${id}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.BAD_REQUEST
          );
        }

        const client = await Report.findById({ id });
        if (!client) {
          throw new ErrorResponse(
            `Invalid Client resource identifier provided <${id}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
  ];
};

export default {
  validatePropertyParams: propertyParams(),
  validateClientParams: clientParams(),
  reportParams: reportParams(),
};
