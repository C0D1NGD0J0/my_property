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

  updateLease = async (req: AppRequest, res: AppResponse) => {
    // const { id } = req.currentuser!;
    const { cid, id } = req.params;

    const fileUploadResponse = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const updateData = {
      ...req.body,
      s3Files: fileUploadResponse?.leaseContract,
    };

    const data = await this.leaseService.updateLease(cid, id, updateData);
    res.status(200).json(data);
  };

  terminateLease = async (req: AppRequest, res: AppResponse) => {
    // const { id } = req.currentuser!;
    const { cid, id } = req.params;

    const data = await this.leaseService.terminateLease(id, req.body);
    res.status(200).json(data);
  };

  getLease = async (req: AppRequest, res: AppResponse) => {
    // const { id } = req.currentuser!;
    const { cid, id } = req.params;

    const data = await this.leaseService.getLease(cid, id);
    res.status(200).json(data);
  };

  getAllLeases = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.currentuser!;
    const { cid } = req.params;
    const { page, limit, sortBy, status, isRenewal } = req.query;

    // pagination
    const paginationQuery: IPaginationQuery = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
      sortBy: sortBy as string,
      skip: null,
    };

    const filter = {
      userId: id,
      status,
      isRenewal,
    };

    paginationQuery.skip =
      paginationQuery && (paginationQuery.page! - 1) * paginationQuery.limit!;

    const data = await this.leaseService.getAllLeases(
      cid,
      filter,
      paginationQuery
    );
    res.status(200).json(data);
  };

  getMyLeases = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.currentuser!;
    const { cid } = req.params;
    const { page, limit, sortBy, status } = req.query;

    // pagination
    const paginationQuery: IPaginationQuery = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
      sortBy: sortBy as string,
      skip: null,
    };

    const filter = {
      tenantId: id,
      status,
    };

    paginationQuery.skip =
      paginationQuery && (paginationQuery.page! - 1) * paginationQuery.limit!;

    const data = await this.leaseService.getMyLeases(
      cid,
      filter,
      paginationQuery
    );
    res.status(200).json(data);
  };

  leaseRenewal = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.currentuser!;
    const { cid, id: leaseId } = req.params;
    const fileUploadResponse = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const leaseData = {
      ...req.body,
      s3Files: fileUploadResponse?.leaseContract,
    };

    const data = await this.leaseService.leaseRenewal(cid, leaseId, leaseData);
    res.status(200).json(data);
  };
}

export default new LeaseController();
