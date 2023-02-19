import { Request, Response } from 'express';

export interface AppRequest extends Request {
  currentuser?: any;
}

export interface AppResponse extends Response {
  currentuser?: any;
}

export interface IEmailOptions<T = unknown> {
  subject: string;
  to: string;
  data: T;
  emailType: string;
}

export interface ISuccessReturnData<T = object> {
  data?: T;
  msg: string;
  success: boolean;
}

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
