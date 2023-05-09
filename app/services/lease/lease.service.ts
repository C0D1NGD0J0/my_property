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
import {
  createLogger,
  mergeArrayWithLimit,
  paginateResult,
} from '@utils/helperFN';
import { ILease, ILeaseDocument } from '@interfaces/lease.interface';

class LeaseService {
  private log;
  private fileUpload: S3FileUpload;

  constructor() {
    this.fileUpload = new S3FileUpload();
    this.log = createLogger('LeaseService', true);
  }

  getLease = async (
    cid: string | undefined,
    leaseid: string | undefined
  ): IPromiseReturnedData<ILeaseDocument | null> => {
    if (!cid) {
      const err = 'Client Id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    if (!leaseid) {
      const err = 'Lease Id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const lease = await Lease.findById(new Types.ObjectId(leaseid)).populate(
      'property',
      'address status'
    );

    return { success: true, data: lease };
  };

  getAllLeases = async (
    cid: string | undefined,
    filter: any,
    data: IPaginationQuery
  ): IPromiseReturnedData<{
    leases: ILeaseDocument[];
    paginate: IPaginateResult;
  }> => {
    if (!cid) {
      const err = 'Client Id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const { userId, status, isRenewal } = filter;
    const { limit, skip, sortBy } = data;
    const query = {
      cid,
      ...(isRenewal ? { isRenewal } : null),
      'status.value': status,
      managedBy: new Types.ObjectId(userId),
    };

    const leases = await Lease.find(query)
      .skip(skip!)
      .limit(limit!)
      .sort(sortBy);

    const count = await Lease.countDocuments(query);

    const paginationInfo = paginateResult(count, skip!, limit!);

    return { success: true, data: { leases, paginate: paginationInfo } };
  };

  getMyLeases = async (
    cid: string | undefined,
    filter: any,
    data: IPaginationQuery
  ): IPromiseReturnedData<{
    leases: ILeaseDocument[];
    paginate: IPaginateResult;
  }> => {
    if (!cid) {
      const err = 'Client Id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const { tenantId, status } = filter;
    const { limit, skip, sortBy } = data;
    const query = {
      cid,
      tenant: tenantId,
      'status.value': status,
    };

    const leases = await Lease.find(query)
      .populate('property', 'address')
      .skip(skip!)
      .limit(limit!)
      .sort(sortBy);

    const count = await Lease.countDocuments(query);

    const paginationInfo = paginateResult(count, skip!, limit!);

    return { success: true, data: { leases, paginate: paginationInfo } };
  };

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
        managementFees: data.paymentInfo?.managementFees,
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

  updateLease = async (
    cid: string,
    leaseId: string,
    data: Partial<ILease & { s3Files: IAWSFileUploadResponse[] }>
  ): IPromiseReturnedData<ILeaseDocument> => {
    const property = (await Property.findOne({
      cid,
      _id: new Types.ObjectId(data.property as string),
    })) as IPropertyDocument;

    let lease = (await Lease.findById(leaseId)) as ILeaseDocument;

    if (data.s3Files && data.s3Files.length) {
      const agreements = data.s3Files.map((fileInfo) => {
        return {
          url: fileInfo.location,
          filename: fileInfo.originalname,
          key: fileInfo.key,
        };
      });

      lease.leaseAgreements = [...lease.leaseAgreements, ...agreements];
    }

    if (lease.status.value === 'active') {
      const dataToUpdate = {
        paymentInfo: {
          rentAmount: data.paymentInfo?.rentAmount
            ? data?.paymentInfo.rentAmount
            : lease.paymentInfo.rentAmount,
          paymentDueDate: data.paymentInfo?.paymentDueDate
            ? data?.paymentInfo.paymentDueDate
            : lease.paymentInfo.paymentDueDate,
          managementFees: data.paymentInfo?.managementFees
            ? data?.paymentInfo.managementFees
            : lease.paymentInfo.managementFees,
          securityDeposit: data.paymentInfo?.securityDeposit
            ? data?.paymentInfo.securityDeposit
            : lease.paymentInfo.securityDeposit,
          paymentFrequency: data.paymentInfo?.paymentFrequency
            ? data?.paymentInfo.paymentFrequency
            : lease.paymentInfo.paymentFrequency,
        },
        managedBy: data.managedBy ? data.managedBy : lease.managedBy,
      };

      lease = (await Lease.findOneAndUpdate(
        { _id: lease.id },
        { $set: dataToUpdate },
        { new: true, runValidators: true }
      )) as ILeaseDocument;
    }

    if (lease.status.value === 'draft' || lease.status.value === 'pending') {
      const dataToUpdate = {
        startDate: data.startDate ? data.startDate : lease.startDate,
        endDate: data.endDate ? data.endDate : lease.endDate,
        paymentInfo: {
          rentAmount: data.paymentInfo?.rentAmount
            ? data?.paymentInfo.rentAmount
            : lease.paymentInfo.rentAmount,
          paymentDueDate: data.paymentInfo?.paymentDueDate
            ? data?.paymentInfo.paymentDueDate
            : lease.paymentInfo.paymentDueDate,
          managementFees: data.paymentInfo?.managementFees
            ? data?.paymentInfo.managementFees
            : lease.paymentInfo.managementFees,
          securityDeposit: data.paymentInfo?.securityDeposit
            ? data?.paymentInfo.securityDeposit
            : lease.paymentInfo.securityDeposit,
          paymentFrequency: data.paymentInfo?.paymentFrequency
            ? data?.paymentInfo.paymentFrequency
            : lease.paymentInfo.paymentFrequency,
        },
        apartmentId: '',
        status: {
          value: data.status?.value,
          reason: data.status?.reason,
        },
      };

      if (data.apartmentId && data.apartmentId !== lease.apartmentId) {
        const apartment = property.findApartment(data.apartmentId);

        if (!apartment) {
          const err = 'Invalid Apartment info provided.';
          this.log.error(color.red(err));
          throw new ErrorResponse(
            err,
            errorTypes.SERVICE_ERROR,
            httpStatusCodes.BAD_REQUEST
          );
        }

        if (apartment.status === 'occupied') {
          const err = 'This apartment is currently occupied.';
          this.log.error(color.red(err));
          throw new ErrorResponse(
            err,
            errorTypes.SERVICE_ERROR,
            httpStatusCodes.BAD_REQUEST
          );
        }

        dataToUpdate.apartmentId = data.apartmentId;
      } else {
        dataToUpdate.apartmentId = data.apartmentId
          ? data.apartmentId
          : lease.apartmentId;
      }

      lease = (await Lease.findOneAndUpdate(
        { _id: lease.id },
        { $set: dataToUpdate },
        { new: true, runValidators: true }
      )) as ILeaseDocument;
    }

    return {
      data: lease,
      success: true,
      msg: 'Lease has been updated.',
    };
  };

  terminateLease = async (
    leaseId: string,
    data: { reason: string }
  ): IPromiseReturnedData<ILeaseDocument> => {
    let lease = (await Lease.findById(leaseId)) as ILeaseDocument;

    const property = (await Property.findOne({
      cid: lease.cid,
      _id: lease.property as Types.ObjectId,
    })) as IPropertyDocument;

    if (
      lease.status.value === 'cancelled' ||
      lease.status.value === 'expired'
    ) {
      const err = 'Lease is currently either expired or cancelled.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    if (lease.status.value === 'pending') {
      const err = 'Unable to terminate a lease in pending state.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    if (lease.status.value === 'active') {
      const dataToUpdate = {
        status: {
          value: 'cancelled',
          reason: data.reason,
        },
      };

      lease = (await Lease.findOneAndUpdate(
        { _id: lease.id },
        { $set: dataToUpdate },
        { new: true, runValidators: true }
      )) as ILeaseDocument;

      if (lease.apartmentId && property.status === 'occupied') {
        const apartment = property.findApartment(lease.apartmentId);
        if (apartment) {
          apartment.activeLease = undefined;
          apartment.status = 'vacant';

          await property.save();
        }
      } else if (!lease.apartmentId && property.status === 'occupied') {
        await Property.findByIdAndUpdate(
          property.id,
          { $set: { status: 'vacant', activeLease: undefined } },
          { new: true }
        );
      }
    }

    return {
      data: lease,
      success: true,
      msg: 'Lease has been terminated.',
    };
  };
}

export default LeaseService;
