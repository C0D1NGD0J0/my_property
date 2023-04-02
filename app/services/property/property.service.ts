import color from 'colors';
import { v4 as uuid } from 'uuid';
import { Types } from 'mongoose';
import { Property } from '@models/index';

import {
  IAWSFileUploadResponse,
  IPaginateResult,
  IPaginationQuery,
  IPromiseReturnedData,
  ISuccessReturnData,
} from '@interfaces/utils.interface';
import {
  IProperty,
  IPropertyTypeEnum,
  IPropertyDocument,
} from '@interfaces/property.interface';
import ErrorResponse from '@utils/errorResponse';
import S3FileUpload from '@services/external/s3.service';
import { ICurrentUser } from '@interfaces/user.interface';
import GeoCoder from '@services/external/geoCoder.service';
import { httpStatusCodes, errorTypes } from '@utils/constants';
import {
  createLogger,
  mergeArrayWithLimit,
  paginateResult,
} from '@utils/helperFN';

class PropertyService {
  private log;
  private fileUpload: S3FileUpload;

  constructor() {
    this.fileUpload = new S3FileUpload();
    this.log = createLogger('PropertyService', true);
  }

  create = async (
    cid: string,
    userId: Types.ObjectId,
    data: Partial<IProperty & { s3Files: IAWSFileUploadResponse[] }>
  ): IPromiseReturnedData<IPropertyDocument> => {
    try {
      const { s3Files, ...dataToSave } = data;

      const property = new Property(dataToSave) as IPropertyDocument;

      if (s3Files && s3Files.length) {
        property.photos = s3Files.map((fileInfo) => {
          return {
            url: fileInfo.location,
            filename: fileInfo.originalname,
            key: fileInfo.key,
          };
        });
      }

      if (property.address) {
        const gCode = await new GeoCoder().parseLocation(property.address);
        property.computedLocation = {
          type: 'Point',
          coordinates: [gCode[0]?.longitude || 200, gCode[0]?.latitude || 201],
          address: {
            city: gCode[0].city,
            state: gCode[0].state,
            country: gCode[0].country,
            postCode: gCode[0].zipcode,
            street: gCode[0].streetName,
            streetNumber: gCode[0].streetNumber,
          },
          latAndlon: `${gCode[0].longitude || 200} ${gCode[0].latitude || 201}`,
        };
        property.address = gCode[0]?.formattedAddress || '';
      }

      property.pid = uuid();
      property.cid = cid;
      property.managedBy = userId;
      await property.save();
      return {
        success: true,
        data: property,
        msg: 'Property has been successfully added.',
      };
    } catch (error: any) {
      this.log.error(color.bold.red(error));
      throw error;
    }
  };

  update = async (
    cid: string,
    data: Partial<IPropertyDocument & { s3Files: IAWSFileUploadResponse[] }>
  ): IPromiseReturnedData<{ property: IPropertyDocument }> => {
    try {
      const { s3Files, ...rest } = data;
      let property = await Property.findOne({
        deletedAt: { $eq: null },
        cid,
        pid: data.pid,
      });

      if (!property) {
        const err = 'Property not found.';
        this.log.error(`Property update: `, err);
        throw new ErrorResponse(
          err,
          errorTypes.SERVICE_ERROR,
          httpStatusCodes.NOT_FOUND
        );
      }

      if (s3Files && s3Files.length) {
        const { data, removedItems } = mergeArrayWithLimit(
          5,
          property.photos,
          s3Files.map((fileInfo) => {
            return {
              url: fileInfo.location,
              filename: fileInfo.originalname,
              key: fileInfo.key,
            };
          })
        );
        for (const item of removedItems) {
          await this.fileUpload.deleteFile(item.key);
        }
        rest.photos = data;
      }

      if (rest.address && property.address !== rest.address) {
        const gCode = await new GeoCoder().parseLocation(rest.address);

        if (gCode[0]) {
          rest.computedLocation = {
            type: 'Point',
            coordinates: [gCode[0].longitude!, gCode[0].latitude!],
            address: {
              city: gCode[0].city,
              state: gCode[0].state,
              country: gCode[0].country,
              postCode: gCode[0].zipcode,
              street: gCode[0].streetName,
              streetNumber: gCode[0].streetNumber,
            },
            latAndlon: `${gCode[0].longitude} ${gCode[0].latitude}`,
          };
          rest.address = gCode[0].formattedAddress;
        }
      }

      property = (await Property.findOneAndUpdate(
        { _id: rest._id, cid: rest.cid },
        { $set: rest },
        {
          new: true,
          runValidators: true,
        }
      )) as IPropertyDocument;

      return { success: true, data: { property } };
    } catch (error: any) {
      this.log.error(color.bold.red(error.message));
      throw error;
    }
  };

  getUserProperties = async (
    cid: string,
    userId: Types.ObjectId,
    data: IPaginationQuery
  ): IPromiseReturnedData<{
    properties: IPropertyDocument[];
    paginate: IPaginateResult;
  }> => {
    try {
      const { limit, skip, sortBy } = data;
      const query = { deletedAt: null, managedBy: userId, cid };

      const properties = await Property.find(query)
        .skip(skip!)
        .limit(limit!)
        .sort(sortBy);
      const count = await Property.countDocuments();

      const paginationInfo = paginateResult(count, skip!, limit!);

      return { success: true, data: { properties, paginate: paginationInfo } };
    } catch (error: any) {
      this.log.error(color.bold.red(error));
      throw error;
    }
  };

  getProperty = async (
    cid: string,
    pid: string
  ): IPromiseReturnedData<IPropertyDocument> => {
    try {
      const property = await Property.findOne({
        deletedAt: { $eq: null },
        cid,
        pid,
      });

      if (!property) {
        const err = 'Property not found for this client.';
        this.log.error(err);
        throw new ErrorResponse(
          err,
          errorTypes.SERVICE_ERROR,
          httpStatusCodes.NOT_FOUND
        );
      }

      return { success: true, data: property };
    } catch (error: any) {
      this.log.error(color.bold.red(error));
      throw error;
    }
  };

  archiveProperty = async (cid: string, pid: string): IPromiseReturnedData => {
    try {
      const property = await Property.findOne({
        deletedAt: { $eq: null },
        cid,
        pid,
      });

      if (!property) {
        const err = 'Property not found.';
        this.log.error(`Property archive: `, err);
        throw new ErrorResponse(
          err,
          errorTypes.SERVICE_ERROR,
          httpStatusCodes.NOT_FOUND
        );
      }

      property.deletedAt = new Date();
      await property.save();
      return { success: true, data: { property } };
    } catch (error: any) {
      this.log.error(color.bold.red(error.message));
      throw error;
    }
  };
}

export default PropertyService;
