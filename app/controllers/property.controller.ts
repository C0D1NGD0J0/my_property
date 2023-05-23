import { Types } from 'mongoose';
import { PropertyService } from '@services/property';
import { ICurrentUser } from '@interfaces/user.interface';
import {
  AppRequest,
  AppResponse,
  IPaginationQuery,
} from '@interfaces/utils.interface';
import { httpStatusCodes } from '@utils/constants';

class PropertyController {
  private propertyService: PropertyService;

  constructor() {
    this.propertyService = new PropertyService();
  }

  createProperty = async (req: AppRequest, res: AppResponse) => {
    const { id, cid } = req.currentuser!;
    const fileUploadResponse = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const newPropertyData = {
      ...req.body,
      s3Files: fileUploadResponse?.propertyImgs,
    };

    const data = await this.propertyService.create(cid, id, newPropertyData);
    res.status(200).json(data);
  };

  createApartment = async (req: AppRequest, res: AppResponse) => {
    const { id, cid } = req.currentuser!;
    const { puid } = req.params;

    const newApartment = {
      ...req.body,
      currentuserId: id,
    };

    const data = await this.propertyService.addApartment(
      cid,
      puid,
      newApartment
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
    const { cid, id } = req.currentuser!;
    const data = await this.propertyService.getUserProperties(
      cid,
      id,
      paginationQuery
    );
    res.status(200).json(data);
  };

  getClientProperties = async (req: AppRequest, res: AppResponse) => {
    const { page, limit, sortBy } = req.query;
    const { cid } = req.params;

    // pagination
    const paginationQuery: IPaginationQuery = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
      sortBy: sortBy as string,
      skip: null,
    };

    paginationQuery.skip =
      paginationQuery && (paginationQuery.page! - 1) * paginationQuery.limit!;

    const data = await this.propertyService.getClientProperties(
      cid,
      paginationQuery
    );
    res.status(200).json(data);
  };

  getProperty = async (req: AppRequest, res: AppResponse) => {
    const { puid } = req.params;
    const { cid } = req.currentuser!;

    const data = await this.propertyService.getProperty(cid, puid);
    res.status(200).json(data);
  };

  updateDetails = async (req: AppRequest, res: AppResponse) => {
    const { puid } = req.params;
    const { cid, id } = req.currentuser!;

    const fileUploadResponse = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const updateData = {
      ...req.body,
      puid,
      s3Files: fileUploadResponse?.propertyImgs,
    };

    const data = await this.propertyService.update(cid, updateData);
    return res.status(httpStatusCodes.OK).json(data);
  };

  archiveProperty = async (req: AppRequest, res: AppResponse) => {
    const { puid } = req.params;
    const { cid } = req.currentuser!;

    const data = await this.propertyService.archiveProperty(cid, puid);
    return res.status(204).json(data);
  };

  archiveApartment = async (req: AppRequest, res: AppResponse) => {
    const { puid, unitId } = req.params;
    const { cid } = req.currentuser!;

    const data = await this.propertyService.archiveApartment(cid, puid, unitId);
    return res.status(204).json(data);
  };
}

export default new PropertyController();
