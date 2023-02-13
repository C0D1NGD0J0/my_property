import { Request, Response } from 'express';

export interface AppRequest extends Request {
  currentuser?: any;
}

export interface AppResponse extends Response {
  currentuser?: any;
}

export interface IEmailOptions {
  subject: string;
  to: string;
  data: unknown;
  emailType: string;
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
