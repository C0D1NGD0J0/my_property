import { Types } from 'mongoose';
import { LeaseService } from '@services/lease';
import { ICurrentUser } from '@interfaces/user.interface';
import {
  AppRequest,
  AppResponse,
  IPaginationQuery,
} from '@interfaces/utils.interface';
import { httpStatusCodes } from '@utils/constants';

class LeaseController {
  private leaseService: LeaseService;

  constructor() {
    this.leaseService = new LeaseService();
  }

  createLease = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.currentuser!;
    const { cid } = req.params;

    const fileUploadResponse = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const newLeaseData = {
      ...req.body,
      s3Files: fileUploadResponse?.leaseContract,
    };

    const data = await this.leaseService.createLease(cid, newLeaseData);
    res.status(200).json(data);
  };
}

export default new LeaseController();
