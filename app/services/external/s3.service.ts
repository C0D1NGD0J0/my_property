import multerS3 from 'multer-s3';
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import multer, { FileFilterCallback } from 'multer';
import { NextFunction, Request, Response } from 'express';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import S3CustomStorage from '@services/external/customStorage';

class S3FileUpload {
  private s3: S3Client;
  private bucket: string;
  private customStorage: S3CustomStorage;

  constructor(bucket = process.env.AWS_BUCKET_NAME as string) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string,
      },
    });
    this.bucket = bucket;
    this.customStorage = new S3CustomStorage(this.s3, this.bucket);
  }

  upload = (req: Request, res: Response, next: NextFunction) => {
    try {
      const _upload = multer({
        storage: this.customStorage,
        fileFilter: this.fileFilter,
        limits: { fileSize: 1024 * 1024 * 5 },
      }).fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'photos', maxCount: 6 },
        { name: 'leaseContract', maxCount: 3 },
      ]);

      return _upload(req, res, next);
    } catch (error) {
      console.log(error, 'S3Service Error');
    }
  };

  textOnlyData = (req: Request, res: Response, next: NextFunction) => {
    const _upload = multer().none();

    return _upload(req, res, next);
  };

  deleteFile = (s3Key: string) => {
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

  private multerS3Config = () => {
    return {
      s3: this.s3,
      bucket: this.bucket,
      key: function (req: Request, file: Express.Multer.File, cb: any) {
        const fileKey = `${Date.now().toString()}_${file.originalname}`;
        cb(null, fileKey);
      },
      contentType: multerS3.AUTO_CONTENT_TYPE,
    };
  };

  private fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const fileExt = file.mimetype.split('/')[1];
    const extArray = ['jpeg', 'jpg', 'png', 'svg'];
    const error = new Error('File type not supported');

    if (extArray.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(error);
    }
  };
}

export default S3FileUpload;
