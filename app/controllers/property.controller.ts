import { Types } from 'mongoose';
import { PropertyService } from '@services/property';
import { ICurrentUser } from '@interfaces/user.interface';
import {
  AppRequest,
  AppResponse,
  IPaginationQuery,
} from '@interfaces/utils.interface';

class PropertyController {
  private propertyService: PropertyService;

  constructor() {
    this.propertyService = new PropertyService();
  }

  createProperty = async (req: AppRequest, res: AppResponse) => {
    const fileUploadResponse = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const newPropertyData = {
      ...req.body,
      s3Files: fileUploadResponse?.propertyImgs,
    };

    const data = await this.propertyService.create(
      req.currentuser!.cid,
      req.currentuser!._id,
      newPropertyData
    );
    res.status(200).json(data);
  };

  getUserProperties = async (req: AppRequest, res: AppResponse) => {
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
    const { cid, _id } = req.currentuser!;
    const data = await this.propertyService.getUserProperties(
      cid,
      _id,
      paginationQuery
    );
    res.status(200).json(data);
  };

  getProperty = async (req: AppRequest, res: AppResponse) => {
    const { pid } = req.params;
    const { cid } = req.currentuser!;

    const data = await this.propertyService.getProperty(cid, pid);
    res.status(200).json(data);
  };
}

export default new PropertyController();
