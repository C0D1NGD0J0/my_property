import express from 'express';
import { ICurrentUser } from '@interfaces/user.interface';

export interface AppRequest extends express.Request {
  session?: Record<string, any>;
  currentuser?: ICurrentUser;
}

export interface AppResponse extends express.Response {
  error?: any;
}

export interface IEmailOptions<T = unknown> {
  subject: string;
  to: string;
  data: T;
  emailType: string;
}

export interface ISuccessReturnData<T = object> {
  data?: T;
  msg?: string;
  success: boolean;
}

export type IPromiseReturnedData<T = object> = Promise<ISuccessReturnData<T>>;

export interface IAWSFileUploadResponse {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  bucket: string;
  key: string;
  acl?: string;
  contentType: string;
  contentDisposition: string | null;
  contentEncoding: string | null;
  storageClass: string;
  serverSideEncryption: string | null;
  metadata: string | null;
  location: string;
  etag: string;
  versionId?: string;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  skip?: number | null;
}

export interface IPaginateResult {
  total: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  hasMoreResource: boolean;
}
