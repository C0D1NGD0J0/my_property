import { Types } from 'mongoose';
import { ReportService } from '@services/report';
import { ICurrentUser } from '@interfaces/user.interface';
import {
  AppRequest,
  AppResponse,
  IPaginationQuery,
} from '@interfaces/utils.interface';
import { httpStatusCodes } from '@utils/constants';

class ReportController {
  private reportService: ReportService;

  constructor() {
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
}

export default new ReportController();
