import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { NextFunction, Request, Response } from 'express';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import S3CustomStorage from '@services/external/customStorage';
import FileUpload from '@services/fileUpload';

class S3FileUpload extends FileUpload {
  private s3: S3Client;
  private bucket: string;
  private customStorage: S3CustomStorage;

  constructor(bucket = process.env.AWS_BUCKET_NAME as string) {
    super();
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string,
      },
    });
    this.bucket = bucket;
    this.customStorage = new S3CustomStorage(this.s3, this.bucket);
    this.reconfigMulter(this.customStorage, 10);
  }

  s3Upload = (req: Request, res: Response, next: NextFunction) => {
    try {
      const upload = this.upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'photos', maxCount: 6 },
        { name: 'leaseContract', maxCount: 3 },
      ]);

      return upload(req, res, next);
    } catch (error) {
      console.log(error, 'S3Service Error');
    }
  };

  deleteS3File = (s3Key: string) => {
    const s3Params: { Bucket: string; Key: string } = {
      Bucket: this.bucket,
      Key: s3Key,
    };

    return this.s3.send(new DeleteObjectCommand(s3Params));
  };

  getS3SignedUrl = async (fileName: string) => {
    if (!fileName) return null;

    const s3Params = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
    });

    return await getSignedUrl(this.s3, s3Params, { expiresIn: 3600 });
  };
}

export default S3FileUpload;
