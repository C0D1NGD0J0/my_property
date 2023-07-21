import color from 'colors';
import { Lease, Property, Report, ReportComment } from '@models/index';

import {
  IAWSFileUploadResponse,
  IPaginateResult,
  IPaginationQuery,
  IPromiseReturnedData,
} from '@interfaces/utils.interface';
import {
  IMaintenanceReport,
  IMaintenanceReportDocument,
} from '@interfaces/report.interface';
import ErrorResponse from '@utils/errorResponse';
import S3FileUpload from '@services/external/s3.service';
import { httpStatusCodes, errorTypes } from '@utils/constants';
import { createLogger, paginateResult } from '@utils/helperFN';
import { IPropertyDocument } from '@interfaces/property.interface';
import { ICommentDocument } from '@interfaces/comment.interface';
import { Types } from 'mongoose';
import dayjs from 'dayjs';

class ReportService {
  private log;
  private fileUpload: S3FileUpload;

  constructor() {
    this.fileUpload = new S3FileUpload();
    this.log = createLogger('ReportService', true);
  }

  allReports = async (
    cid: string,
    puid: string,
    data: IPaginationQuery
  ): IPromiseReturnedData<{
    reports: IMaintenanceReport[];
    paginate: IPaginateResult;
  }> => {
    const { limit, skip, sortBy } = data;
    if (!puid || !cid) {
      const err = 'Property identifier missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const property: IPropertyDocument | null = await Property.findOne({
      cid,
      puid,
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

    const query = { cid, puid, deletedAt: undefined };
    const reports = await Report.find(query)
      .skip(skip!)
      .limit(limit!)
      .sort(sortBy);

    const count = await Report.countDocuments(query);
    const paginationInfo = paginateResult(count, skip!, limit!);

    return {
      success: true,
      data: { reports, paginate: paginationInfo },
    };
  };

  getReport = async (
    reportid: string | undefined
  ): IPromiseReturnedData<IMaintenanceReportDocument | null> => {
    if (!reportid) {
      const err = 'Report Id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const report = await Report.findById(new Types.ObjectId(reportid));

    return { success: true, data: report };
  };

  create = async (
    cid: string,
    puid: string,
    data: Partial<IMaintenanceReport & { s3Files: IAWSFileUploadResponse[] }>
  ): IPromiseReturnedData<IMaintenanceReportDocument> => {
    if (!puid) {
      const err = 'Property identifier is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const property: IPropertyDocument | null = await Property.findOne({
      cid,
      puid: puid,
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

    const lease = await Lease.findOne({
      cid,
      puid: data.puid,
      // status: { value: 'active'}
    });

    if (!lease) {
      const err = 'Unable to create report, no active lease found.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const _report = new Report({
      cid,
      lease: lease._id,
      title: data.title,
      status: data.status,
      puid: property.puid,
      creator: data.creator,
      priority: data.priority,
      category: data.category,
      description: data.description,
    });

    if (data.s3Files && data.s3Files.length) {
      _report.attachments = data.s3Files.map((fileInfo) => {
        return {
          key: fileInfo.key,
          url: fileInfo.location,
          mediaType: fileInfo.mimetype,
          filename: fileInfo.originalname,
        };
      });
    }

    await _report.save();
    return {
      data: _report,
      success: true,
      msg: 'New report has been created.',
    };
  };

  update = async (
    reportId: string,
    data: Partial<IMaintenanceReport & { s3Files: IAWSFileUploadResponse[] }>
  ): IPromiseReturnedData<IMaintenanceReport> => {
    if (!reportId) {
      const err = 'Report identifier is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const property: IPropertyDocument | null = await Property.findOne({
      puid: data.puid,
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

    const report = await Report.findById(reportId);
    if (!report) {
      const err = 'Report not found.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    if (data.s3Files && data.s3Files.length) {
      const attachments = data.s3Files.map((fileInfo) => {
        return {
          key: fileInfo.key,
          url: fileInfo.location,
          mediaType: fileInfo.mimetype,
          filename: fileInfo.originalname,
        };
      });

      report.attachments = [...attachments, ...report.attachments];
    }

    report.title = data?.title ? data.title : report.title;
    report.category = data?.category ? data.category : report.category;
    report.description = data?.description
      ? data.description
      : report.description;

    if (report.status === 'closed' || report.status === 'resolved') {
      await report.save();
      return {
        data: report,
        success: true,
        msg: 'Report has been updated.',
      };
    }

    report.status = data?.status ? data.status : report.status;
    report.priority = data?.priority ? data.priority : report.priority;

    await report.save();
    return {
      data: report,
      success: true,
      msg: 'Report has been updated.',
    };
  };

  updateStatus = async (
    reportId: string,
    data: Pick<IMaintenanceReport, 'status' | 'priority'>
  ): IPromiseReturnedData<IMaintenanceReport> => {
    if (!reportId) {
      const err = 'Report identifier is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const report = await Report.findById(reportId);
    if (!report) {
      const err = 'Report not found.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    if (report.status === 'resolved') {
      const err = 'This report has previously been resolved.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.BAD_REQUEST_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    report.status = data?.status;
    report.priority = data?.priority ? data.priority : report.priority;

    await report.save();
    return {
      data: report,
      success: true,
      msg: 'Report has been updated.',
    };
  };

  archiveReport = async (
    reportId: string
  ): IPromiseReturnedData<IMaintenanceReport> => {
    if (!reportId) {
      const err = 'Report identifier is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const report = await Report.findById(reportId);
    if (!report) {
      const err = 'Report not found.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    report.deletedAt = new Date();
    await report.save();

    return {
      data: report,
      success: true,
      msg: 'Report has been archived.',
    };
  };

  // Comments
  getComments = async (
    reportId: string | undefined,
    data: IPaginationQuery
  ): IPromiseReturnedData<{
    comments: ICommentDocument[];
    paginate: IPaginateResult;
  }> => {
    const { limit, skip, sortBy } = data;
    if (!reportId) {
      const err = 'Report identifier is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const query = {
      report: new Types.ObjectId(reportId),
      deletedAt: undefined,
    };
    const report = await Report.findById(reportId);
    if (!report) {
      const err = 'Report not found.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const comments = await ReportComment.find(query)
      .skip(skip!)
      .limit(limit!)
      .sort(sortBy);

    const count = await ReportComment.countDocuments(query);
    const paginationInfo = paginateResult(count, skip!, limit!);

    return {
      data: { comments, paginate: paginationInfo },
      success: true,
    };
  };

  addComment = async (
    reportId: string | undefined,
    data: Partial<ICommentDocument>
  ): IPromiseReturnedData<ICommentDocument> => {
    if (!reportId) {
      const err = 'Report identifier is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const report = await Report.findById(reportId);
    if (!report) {
      const err = 'Report not found.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    if (report.status === 'closed') {
      const err = 'Unable to add comment as report has been marked closed.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.UNPROCESSABLE
      );
    }

    const comment = new ReportComment(data);
    await comment.save();
    return {
      data: comment,
      success: true,
    };
  };

  editComment = async (
    commentId: string | undefined,
    data: Pick<ICommentDocument, 'text'>
  ): IPromiseReturnedData<ICommentDocument> => {
    if (!commentId) {
      const err = 'Comment identifier is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const comment = await ReportComment.findById(commentId);
    if (!comment) {
      const err = 'Comment not found.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    comment.text = data.text;
    await comment.save();
    return {
      data: comment,
      success: true,
    };
  };

  archiveComment = async (
    commentId: string | undefined
  ): IPromiseReturnedData => {
    if (!commentId) {
      const err = 'Comment identifier is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const comment = await ReportComment.findById(commentId);
    if (!comment) {
      const err = 'Comment not found.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    comment.deletedAt = new Date();
    await comment.save();

    return {
      success: true,
    };
  };
}

export default ReportService;
