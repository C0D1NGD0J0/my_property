import { PropertyService } from '@services/property';
import { ICurrentUser } from '@interfaces/user.interface';
import { AppRequest, AppResponse } from '@interfaces/utils.interface';

class PropertyController {
  private propertyService: PropertyService;

  constructor() {
    this.propertyService = new PropertyService();
  }

  createProperty = async (req: AppRequest, res: AppResponse) => {
    const fileUploadResponse = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const newPropertyData = {
      ...req.body,
      s3Files: fileUploadResponse?.propertyImgs,
    };

    const data = await this.propertyService.create(
      newPropertyData,
      req.currentuser as ICurrentUser
    );
    res.status(200).json(data);
  };
}

export default new PropertyController();
