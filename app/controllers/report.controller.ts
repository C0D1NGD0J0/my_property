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
}

export default new ReportController();
