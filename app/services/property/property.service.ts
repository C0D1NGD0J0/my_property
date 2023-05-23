import color from 'colors';
import { v4 as uuid } from 'uuid';
import { Types } from 'mongoose';
import { Lease, Property } from '@models/index';

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
  IApartmentUnit,
  IApartmentUnitDocument,
  IPropertyStatusEnum,
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
    userId: string,
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

      property.cid = cid;
      property.puid = uuid();
      property.managedBy = new Types.ObjectId(userId);

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
        puid: data.puid,
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
    userId: string,
    data: IPaginationQuery
  ): IPromiseReturnedData<{
    properties: IPropertyDocument[];
    paginate: IPaginateResult;
  }> => {
    try {
      const { limit, skip, sortBy } = data;
      const query = {
        deletedAt: null,
        managedBy: new Types.ObjectId(userId),
        cid,
      };

      const properties = await Property.find(query)
        .skip(skip!)
        .limit(limit!)
        .sort(sortBy);
      const count = await Property.countDocuments(query);

      const paginationInfo = paginateResult(count, skip!, limit!);

      return { success: true, data: { properties, paginate: paginationInfo } };
    } catch (error: any) {
      this.log.error(color.bold.red(error));
      throw error;
    }
  };

  getProperty = async (
    cid: string,
    puid: string
  ): IPromiseReturnedData<IPropertyDocument | null> => {
    try {
      const property = await Property.findOne({
        deletedAt: { $eq: null },
        cid,
        puid,
        apartmentUnits: {
          $elemMatch: {
            deletedAt: { $eq: null },
          },
        },
      });

      return { success: true, data: property };
    } catch (error: any) {
      this.log.error(color.bold.red(error));
      throw error;
    }
  };

  archiveProperty = async (cid: string, puid: string): IPromiseReturnedData => {
    try {
      const property = await Property.findOne({
        deletedAt: { $eq: null },
        cid,
        puid,
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

      if (await property.hasActiveLease()) {
        const err = 'Unable to archive Property, due to an active lease.';
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

  archiveApartment = async (
    cid: string,
    puid: string,
    unitNumber: string
  ): IPromiseReturnedData => {
    try {
      const property = await Property.findOne({
        cid,
        puid,
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

      const apartmentUnit = property.apartmentUnits.find(
        (unit) => unit.unitNumber === unitNumber
      );

      if (!apartmentUnit) {
        const err = 'Apartment unit not found.';
        this.log.error(`Property archive: `, err);
        throw new ErrorResponse(
          err,
          errorTypes.SERVICE_ERROR,
          httpStatusCodes.NOT_FOUND
        );
      }

      if (apartmentUnit.status === 'occupied') {
        const err = 'Apartment currently has an active lease.';
        this.log.error(`Property archive: `, err);
        throw new ErrorResponse(
          err,
          errorTypes.BAD_REQUEST_ERROR,
          httpStatusCodes.BAD_REQUEST
        );
      }

      if (apartmentUnit.status === 'vacant') {
        apartmentUnit.activeLease = undefined;
        apartmentUnit.deletedAt = new Date();
      }

      await property.save();
      return { success: true, data: { property } };
    } catch (error: any) {
      this.log.error(color.bold.red(error.message));
      throw error;
    }
  };

  leaseProperty = async (cid: string, puid: string, leaseId: string) => {
    const property = await Property.findOne({ cid, puid });
    const lease = await Lease.findById(leaseId);

    if (!property) {
      const err = 'Property not found for this client.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    if (!lease) {
      const err = 'Invalid Lease identifier provided <Not found>.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    if (property.status === IPropertyStatusEnum.vacant) {
      property.activeLease = lease._id;
      property.previousLeases.push(lease._id);
      property.status = IPropertyStatusEnum.occupied;
    }

    await property.save();
    return {
      success: true,
      data: property,
    };
  };

  leaseApartment = async (
    cid: string,
    puid: string,
    data: { aid: string; leaseId: string }
  ) => {
    const property = await Property.findOne({ cid, puid });

    if (!property) {
      const err = 'Property not found.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.NO_RESOURCE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const apartment = property.apartmentUnits.id(data.aid);
    if (!apartment) {
      const err = 'Apartment unit not found.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    if (apartment.status == IPropertyStatusEnum.vacant) {
      // validate leaseId provided to see if there is an actual record if not throw error
      apartment.previousLeases.push(new Types.ObjectId(data.leaseId));
      apartment.activeLease = new Types.ObjectId(data.leaseId);
      apartment.status = 'occupied';
    } else {
      // find lease by id
      // check the start/end date if its still valid
      // if valid check lease status if active
      // send error that lease is still active can't
      // if valid but status is inactive check for reason why it was cancelled.
      // if start/end date are invalid
      // check renewal status value [n/a, initiated, renewed, canceled]
      // if n/a create new lease with info supplied in the initial request
      // else send error that property is current in renewal phase
    }
    await property.save();

    return {
      success: true,
      data: property.apartmentUnits,
    };
  };

  addApartment = async (cid: string, puid: string, data: IApartmentUnit) => {
    const property = await Property.findOne({ cid, puid });

    if (!property) {
      const err = 'Property not found for this client.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const unittypes = ['apartments', 'officeUnits', 'others', 'multiUnits'];
    if (!unittypes.includes(property.propertyType)) {
      const err = "Apartments can't be added to this property type.";
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const { totalUnits, apartmentUnits } = property;
    if (apartmentUnits && apartmentUnits?.length >= totalUnits) {
      const err = `You have reached the max number of apartments units ${totalUnits} for this property.`;
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.BAD_REQUEST_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    apartmentUnits.push({
      ...data,
      auid: uuid(),
    });

    await property.save();
    return {
      success: true,
      data: property.apartmentUnits,
    };
  };

  setApartmentToVacant = async (
    cid: string,
    puid: string,
    data: { id: string }
  ) => {
    const property = await Property.findOne({ cid, puid });

    if (!property) {
      const err = 'Property not found.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.NO_RESOURCE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const apartment = property.apartmentUnits.id(data.id);
    if (!apartment) {
      const err = 'Apartment unit not found.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    apartment.activeLease = undefined;
    apartment.status = 'vacant';
    await property.save();

    return {
      success: true,
      data: property.apartmentUnits,
    };
  };

  /* ClientUser region */
  getClientProperties = async (
    cid: string,
    data: IPaginationQuery
  ): IPromiseReturnedData<{
    properties: IPropertyDocument[];
    paginate: IPaginateResult;
  }> => {
    if (!cid) {
      const err = 'Client id is missing.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const selectedFields = {
      activeLease: 1,
      status: 1,
      managedBy: 1,
      address: 1,
      apartmentUnits: 1,
      totalUnits: 1,
      _id: 1,
    };

    try {
      const { limit, skip, sortBy } = data;
      const query = {
        deletedAt: null,
        cid,
      };

      const properties = await Property.find(query, selectedFields)
        .skip(skip!)
        .limit(limit!)
        .sort(sortBy);
      const count = await Property.countDocuments(query);

      const paginationInfo = paginateResult(count, skip!, limit!);

      return { success: true, data: { properties, paginate: paginationInfo } };
    } catch (error: any) {
      this.log.error(color.bold.red(error));
      throw error;
    }
  };
  /* end region */
}

export default PropertyService;
