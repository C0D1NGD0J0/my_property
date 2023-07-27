import { Types } from 'mongoose';
import { ReportService } from '@services/report';
import { ICurrentUser } from '@interfaces/user.interface';
import {
  AppRequest,
  AppResponse,
  IPaginationQuery,
} from '@interfaces/utils.interface';
import { httpStatusCodes } from '@utils/constants';
import { ReportCache } from '@caching/index';

class ReportController {
  private reportService: ReportService;
  private cache: ReportCache;

  constructor() {
    this.cache = new ReportCache();
    this.reportService = new ReportService();
  }

  getReports = async (req: AppRequest, res: AppResponse) => {
    const { puid } = req.params;
    const { cid } = req.currentuser!;
    const { page, limit, sortBy } = req.query;

    // pagination
    const paginationQuery: IPaginationQuery = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
      sortBy: sortBy as string,
      skip: null,
    };

    paginationQuery.skip =
      paginationQuery && (paginationQuery.page! - 1) * paginationQuery.limit!;

    const data = await this.reportService.allReports(
      cid,
      puid,
      paginationQuery
    );

    res.status(httpStatusCodes.OK).json(data);
  };

  getReport = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.params;
    let data;
    const resp = await this.cache.getReport(id);
    if (resp.data) {
      data = { ...resp };
    } else {
      data = await this.reportService.getReport(id);
    }

    res.status(200).json(data);
  };

  createReport = async (req: AppRequest, res: AppResponse) => {
    const { id, cid } = req.currentuser!;
    const { puid } = req.params;

    const fileUploadResponse = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const newReportData = {
      ...req.body,
      s3Files: fileUploadResponse?.propertyImgs,
      creator: (req.currentuser as ICurrentUser).id,
    };

    const data = await this.reportService.create(cid, puid, newReportData);
    data && data.data && this.cache.createReport(data.data);
    res.status(httpStatusCodes.OK).json(data);
  };

  updateReport = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.params;

    const fileUploadResponse = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const updateData = {
      ...req.body,
      s3Files: fileUploadResponse?.propertyImgs,
    };

    const data = await this.reportService.update(id, updateData);
    res.status(httpStatusCodes.OK).json(data);
  };

  updateStatus = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.params;

    const data = await this.reportService.updateStatus(id, req.body);
    res.status(httpStatusCodes.OK).json(data);
  };

  archiveReport = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.params;

    const data = await this.reportService.archiveReport(id);
    res.status(httpStatusCodes.OK).json(data);
  };

  // Comments
  getComments = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.params;
    const { page, limit, sortBy } = req.query;

    // pagination
    const paginationQuery: IPaginationQuery = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
      sortBy: sortBy as string,
      skip: null,
    };

    paginationQuery.skip =
      paginationQuery && (paginationQuery.page! - 1) * paginationQuery.limit!;

    const cacheData = await this.cache.getComments(
      id,
      paginationQuery.page,
      paginationQuery.limit
    );
    if (cacheData?.data.length > 0) {
      return res.status(httpStatusCodes.OK).json(cacheData);
    }

    const data = await this.reportService.getComments(id, paginationQuery);
    res.status(httpStatusCodes.OK).json(data);
  };

  addComment = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.params;

    const commentData = {
      ...req.body,
      report: new Types.ObjectId(id),
      author: new Types.ObjectId(req.currentuser!.id),
    };

    const data = await this.reportService.addComment(id, commentData);
    data && data.data && (await this.cache.addComment(id, data.data));
    res.status(httpStatusCodes.OK).json(data);
  };

  editComment = async (req: AppRequest, res: AppResponse) => {
    const { commentId } = req.params;

    const commentData = {
      ...req.body,
      _id: new Types.ObjectId(commentId),
    };

    const data = await this.reportService.editComment(commentId, commentData);
    res.status(httpStatusCodes.OK).json(data);
  };

  archiveComment = async (req: AppRequest, res: AppResponse) => {
    const { commentId } = req.params;
    const _comment = req.body;

    const data = await this.reportService.archiveComment(commentId);
    res.status(httpStatusCodes.OK).json(data);
  };
}

export default new ReportController();
