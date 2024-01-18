import {
  CompleteMultipartUploadCommandOutput,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import multer, { StorageEngine } from 'multer';
import { Request } from 'express';

export default class S3CustomStorage implements StorageEngine {
  private s3: S3Client;
  private bucket: string;

  constructor(s3: S3Client, bucket: string) {
    this.s3 = s3;
    this.bucket = bucket;
  }

  async _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void
  ): Promise<void> {
    const key = `${Date.now().toString()}_${file.originalname}`;
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: file.stream,
      },
    });

    upload.on('httpUploadProgress', (progress) => {
      console.log(`Uploaded ${progress.loaded} of ${progress.total} bytes`);
    });

    try {
      const res = (await upload.done()) as CompleteMultipartUploadCommandOutput;
      (file as any).key = res.Key; // Add key to file object
      (file as any).location = res.Location; // Add location to file object

      cb(null, file); // Pass the modified file object
    } catch (error) {
      console.error('Error in file upload:', error);
      cb(error);
    }
  }

  async _removeFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void
  ): Promise<void> {
    const deleteParams = {
      Bucket: this.bucket,
      Key: file.filename, // Assuming 'filename' contains the key of the file in the bucket
    };

    this.s3
      .send(new DeleteObjectCommand(deleteParams))
      .then(() => cb(null))
      .catch((error) => {
        console.error('Error in file removal:', error);
        cb(error);
      });
  }
}
