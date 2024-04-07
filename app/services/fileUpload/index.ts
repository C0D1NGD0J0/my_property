import multer, { FileFilterCallback, StorageEngine } from 'multer';
import { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

interface IFileUpload {
  getFile(filePath: string): Promise<Buffer | null>;
  deleteFile(filePath: string): Promise<boolean>;
  saveCsvToDisk(
    req: Request,
    res: Response,
    next: NextFunction,
    saveDir: string
  ): void;
  textOnlyData(req: Request, res: Response, next: NextFunction): void;
}

class FileUpload implements IFileUpload {
  protected upload: multer.Multer;
  private storagePath: string; // Default storage path

  constructor(savePath = 'uploads/', size = 10) {
    this.upload = multer({
      fileFilter: this.fileFilter,
      limits: { fileSize: 1024 * 1024 * size }, // 10MB
    });
    this.storagePath = savePath;
  }

  getFile(filename: string): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(this.storagePath, filename), (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return reject(err);
        }
        resolve(data);
      });
    });
  }

  deleteFile(filename: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.unlink(path.join(this.storagePath, filename), (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  saveCsvToDisk = (req: Request, res: Response, next: NextFunction) => {
    try {
      const csvStorage = multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), this.storagePath);
          // Check if the directory exists
          if (!fs.existsSync(uploadDir)) {
            // If the directory doesn't exist, create it
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
          const fileName = `${file.originalname}`;
          cb(null, fileName);
        },
      });

      const csvFilter = (
        req: Request,
        file: Express.Multer.File,
        cb: FileFilterCallback
      ) => {
        if (file.mimetype.includes('csv')) {
          cb(null, true);
        } else {
          cb(new Error('Only CSV files are allowed!'));
        }
      };

      this.upload = multer({
        storage: csvStorage,
        fileFilter: csvFilter,
        limits: { fileSize: 1024 * 1024 * 20 }, // 20MB limit
      });

      return this.upload.single('csvFile')(req, res, next);
    } catch (error) {
      console.error(error, 'Local CSV Upload Error');
      next(error);
    }
  };

  textOnlyData = (req: Request, res: Response, next: NextFunction) => {
    const _upload = this.upload.none();

    return _upload(req, res, next);
  };

  protected reconfigMulter(storage: StorageEngine, fileSize = 5) {
    return (this.upload = multer({
      storage,
      fileFilter: this.fileFilter,
      limits: { fileSize: 1024 * 1024 * fileSize },
    }));
  }

  protected fileFilter = (
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

export default FileUpload;
