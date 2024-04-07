import sanitizeHtml from 'sanitize-html';
import { PropertyService } from '@services/property';
import { ICurrentUser } from '@interfaces/user.interface';
import {
  AppRequest,
  AppResponse,
  IPaginationQuery,
} from '@interfaces/utils.interface';
import { httpStatusCodes } from '@utils/constants';
import { parseAndValidatePropertiesCsv } from '@utils/helperFN';
import FileUpload from '@services/fileUpload';

const saveDir = `${process.cwd()}/uploads/csv`;
const fileUploadService = new FileUpload(saveDir);
class PropertyController {
  private readonly propertyService: PropertyService;

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
      description: {
        text: sanitizeHtml(req.body.description.text),
        html: sanitizeHtml(req.body.description.html),
      },
      s3Files: fileUploadResponse?.photos,
    };

    const data = await this.propertyService.create(cid, id, newPropertyData);
    res.status(httpStatusCodes.OK).json(data);
  };

  processCsvUpload = async (req: AppRequest, res: AppResponse) => {
    const { id, cid } = req.currentuser!;
    const data = await parseAndValidatePropertiesCsv(req.file?.path || '');

    res.status(httpStatusCodes.OK).json({
      success: !!data.errors,
      fileName: req.file?.filename,
      validProperties: data.validProperties.length,
      errors: data.errors,
    });
  };

  saveProcessedCsvUpload = async (req: AppRequest, res: AppResponse) => {
    const { id: currentuserId, cid } = req.currentuser!;
    const filename = req.body.fileName;

    if (!filename) {
      console.log('filename not provided');
      return res.status(httpStatusCodes.OK).json({ success: false });
    }

    if (!req.body.saveAsIs) {
      //  if user cancels the csv process fromt he frontend by closing the modal or clicking the cancel btn
      const isDeleted = await fileUploadService.deleteFile(req.body.fileName);
      return res.status(httpStatusCodes.OK).json({
        success: isDeleted,
        msg: 'CSV upload has been cancelled.',
        action: 'insertionCancelled',
      });
    }

    const parsedData = await parseAndValidatePropertiesCsv(
      `${saveDir}/${req.body.fileName}`
    );
    const data = await this.propertyService.bulkInsertion(
      cid,
      currentuserId,
      parsedData.validProperties
    );
    // delete csv file after succesafully saving data to db
    fileUploadService.deleteFile(req.body.fileName);
    res.status(httpStatusCodes.OK).json(data);
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
    res.status(httpStatusCodes.OK).json(data);
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
    res.status(httpStatusCodes.OK).json(data);
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
    res.status(httpStatusCodes.OK).json(data);
  };

  getProperty = async (req: AppRequest, res: AppResponse) => {
    const { puid } = req.params;
    const { cid } = req.currentuser!;

    const data = await this.propertyService.getProperty(cid, puid);
    res.status(httpStatusCodes.OK).json(data);
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
    return res.status(httpStatusCodes.OK).json(data);
  };

  archiveApartment = async (req: AppRequest, res: AppResponse) => {
    const { puid, unitId } = req.params;
    const { cid } = req.currentuser!;

    const data = await this.propertyService.archiveApartment(cid, puid, unitId);
    return res.status(httpStatusCodes.OK).json(data);
  };
}

export default new PropertyController();
