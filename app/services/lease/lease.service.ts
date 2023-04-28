import color from 'colors';
import { v4 as uuid } from 'uuid';
import { ObjectId, Types } from 'mongoose';
import { Lease, Property } from '@models/index';

import {
  IAWSFileUploadResponse,
  IPaginateResult,
  IPaginationQuery,
  IPromiseReturnedData,
  ISuccessReturnData,
} from '@interfaces/utils.interface';
import {
  IPropertyTypeEnum,
  IPropertyDocument,
} from '@interfaces/property.interface';
import ErrorResponse from '@utils/errorResponse';
import S3FileUpload from '@services/external/s3.service';
import { ICurrentUser } from '@interfaces/user.interface';
import { httpStatusCodes, errorTypes } from '@utils/constants';
import { createLogger, paginateResult } from '@utils/helperFN';
import { ILease, ILeaseDocument } from '@interfaces/lease.interface';

class LeaseService {
  private log;
  private fileUpload: S3FileUpload;

  constructor() {
    this.fileUpload = new S3FileUpload();
    this.log = createLogger('LeaseService', true);
  }

  createLease = async (
    cid: string,
    data: Partial<ILease & { s3Files: IAWSFileUploadResponse[] }>
  ): IPromiseReturnedData<ILeaseDocument> => {
    const property = (await Property.findOne({
      cid,
      _id: new Types.ObjectId(data.property as string),
    })) as IPropertyDocument;

    // Check if property already has an active lease
    const activeLease = await Lease.findOne({
      cid,
      property: data.property,
      endDate: { $gte: new Date() },
    });

    if (activeLease) {
      const err = 'Property already has an active lease.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    if (!data.startDate || !data.endDate) {
      const err = 'Missing Date value for either startDate/endDate';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const lease = new Lease({
      cid,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      property: property._id,
      paymentInfo: {
        rentAmount: data.paymentInfo?.rentAmount,
        securityDeposit: data.paymentInfo?.securityDeposit,
        paymentDueDate: data.paymentInfo?.paymentDueDate,
        billingType: data.paymentInfo?.paymentFrequency,
        managementFees: property.managementFees.amount,
      },

      managedBy: data.managedBy,
    });

    if (data.s3Files && data.s3Files.length) {
      lease.leaseAgreements = data.s3Files.map((fileInfo) => {
        return {
          url: fileInfo.location,
          filename: fileInfo.originalname,
          key: fileInfo.key,
        };
      });
    }

    await lease.save();
    return {
      data: lease,
      success: true,
      msg: 'New lease has been created.',
    };
  };
}

export default LeaseService;
