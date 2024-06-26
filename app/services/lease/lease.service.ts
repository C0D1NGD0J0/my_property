import color from 'colors';
import { ObjectId, Types } from 'mongoose';
import { Lease, Property } from '@models/index';

import {
  IAWSFileUploadResponse,
  IPaginateResult,
  IPaginationQuery,
  IPromiseReturnedData,
} from '@interfaces/utils.interface';
import {
  IPropertyDocument,
  IPropertyTypeEnum,
} from '@interfaces/property.interface';
import ErrorResponse from '@utils/errorResponse';
import S3FileUpload from '@services/external/s3.service';
import { httpStatusCodes, errorTypes } from '@utils/constants';
import { createLogger, paginateResult } from '@utils/helperFN';
import { ILease, ILeaseDocument } from '@interfaces/lease.interface';
import { IUserDocument } from '@interfaces/user.interface';

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
      puid: data.puid as string,
    })) as IPropertyDocument;

    if (property.deletedAt) {
      const err = 'This Property is no longer available.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    if (
      property.propertyType !== IPropertyTypeEnum.singleFamily &&
      !data.apartmentId
    ) {
      const err = 'Apartment id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.UNPROCESSABLE
      );
    }

    let lease = await Lease.findOne({
      cid,
      puid: data.puid,
      endDate: { $gte: new Date() },
      ...(data.apartmentId ? { apartmentId: data.apartmentId } : null),
    });

    if (
      lease &&
      (lease.apartmentId === data.apartmentId ||
        (lease.puid === data.puid && !data.apartmentId))
    ) {
      const err = 'Error, due to duplicate lease for property.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    if (lease?.status.value === 'active') {
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

    lease = new Lease({
      cid,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      puid: property.puid,
      ...(data.apartmentId ? { apartmentId: data.apartmentId } : null),
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

  leaseRenewal = async (
    cid: string,
    leaseId: string,
    data: Partial<ILease & { s3Files: IAWSFileUploadResponse[] }>
  ): IPromiseReturnedData<ILeaseDocument> => {
    const property = (await Property.findOne({
      cid,
      puid: data.puid as string,
    })) as IPropertyDocument;

    if (property.deletedAt) {
      const err = 'This Property is no longer available.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    if (
      property.propertyType !== IPropertyTypeEnum.singleFamily &&
      !data.apartmentId
    ) {
      const err = 'Apartment id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.UNPROCESSABLE
      );
    }

    if (!leaseId) {
      const err = 'Lease id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.UNPROCESSABLE
      );
    }

    const lease = await Lease.findById(leaseId).populate({
      path: 'managedBy',
      model: 'User',
      select: 'firstName lastName', // Only return the fullName virtual property
    });

    if (!lease) {
      const err = 'Lease not found.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.NO_RESOURCE_ERROR,
        httpStatusCodes.NOT_FOUND
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

    if (lease?.status.value === 'active') {
      lease.leaseHistory.push({
        previousEndDate: lease.endDate,
        previousStartDate: lease.startDate,
        previousPaymentInfo: lease.paymentInfo,
        managedBy: (lease.managedBy as IUserDocument).fullname as string,
      });

      lease.isRenewal = true;
      lease.endDate = data.endDate;
      lease.startDate = data.startDate;
      lease.paymentInfo = data?.paymentInfo || lease.paymentInfo;

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
    }

    return {
      data: lease,
      success: true,
      msg: 'Lease has been renewed.',
    };
  };

  updateLease = async (
    cid: string,
    leaseId: string | Types.ObjectId | undefined,
    data: Partial<ILease & { s3Files: IAWSFileUploadResponse[] }>
  ): IPromiseReturnedData<{ lease: ILeaseDocument }> => {
    let lease = (await Lease.findById(leaseId)) as ILeaseDocument;

    if (!lease) {
      const err = 'Lease not found..';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const property = await Property.findOne({
      puid: data?.puid || lease.puid,
      $and: [{ cid }],
    });

    if (!property) {
      const err = 'Property not found.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    if (
      property &&
      property.propertyType !== 'singleFamily' &&
      lease &&
      !lease.apartmentId
    ) {
      const err = 'Apartment Id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

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
    } else if (lease.status.value === 'draft') {
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
        apartmentId: data?.apartmentId || lease.apartmentId,
        status: {
          value: data.status?.value,
          reason: data.status?.reason,
        },
        tenant: data?.tenant || lease.tenant,
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
      }

      lease = (await Lease.findOneAndUpdate(
        { _id: lease.id },
        { $set: dataToUpdate },
        { new: true, runValidators: true }
      )) as ILeaseDocument;
    } else if (lease.status.value === 'pending') {
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
        status: {
          value: data.status?.value,
          reason: data.status?.reason,
        },
        dateTenantAccepted: data.dateTenantAccepted,
        hasTenantAccepted: data.hasTenantAccepted,
      };

      lease = (await Lease.findOneAndUpdate(
        { _id: lease.id },
        { $set: dataToUpdate },
        { new: true, runValidators: true }
      )) as ILeaseDocument;
    }

    return {
      data: { lease },
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
      puid: lease.puid,
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

      if (lease.apartmentId && property.propertyType !== 'singleFamily') {
        const apartment = property.findApartment(lease.apartmentId);
        if (apartment) {
          apartment.activeLease = undefined;
          apartment.status = 'vacant';

          await property.save();
        }
      } else if (
        !lease.apartmentId &&
        property.propertyType === 'singleFamily'
      ) {
        await Property.findByIdAndUpdate(
          property.id,
          { $set: { ...dataToUpdate, activeLease: undefined } },
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
