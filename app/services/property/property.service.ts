import color from 'colors';
import { v4 as uuid } from 'uuid';
import { Property } from '@models/index';
import {
  IAWSFileUploadResponse,
  ISuccessReturnData,
} from '@interfaces/utils.interface';
import {
  IProperty,
  PropertyTypeEnum,
  IPropertyDocument,
} from '@interfaces/property.interface';
import { createLogger } from '@utils/helperFN';
import ErrorResponse from '@utils/errorResponse';
import { ICurrentUser } from '@interfaces/user.interface';
import GeoCoder from '@services/external/geoCoder.service';

class PropertyService {
  private log;

  constructor() {
    this.log = createLogger('PropertyService', true);
  }

  create = async (
    data: Partial<IProperty & { s3Files: IAWSFileUploadResponse[] }>,
    currentuser: ICurrentUser
  ): Promise<ISuccessReturnData<IPropertyDocument>> => {
    try {
      const { s3Files, ...dataToSave } = data;

      const property = new Property(dataToSave) as IPropertyDocument;

      if (s3Files && s3Files.length) {
        property.photos = s3Files.map((fileInfo) => {
          return {
            url: fileInfo.location,
            filename: fileInfo.originalname,
            key: fileInfo.key,
          };
        });
      }

      if (property.address) {
        const gCode = await new GeoCoder().parseLocation(property.address);
        property.computedLocation = {
          type: 'Point',
          coordinates: [gCode[0]?.longitude || 200, gCode[0]?.latitude || 201],
          address: {
            city: gCode[0].city,
            state: gCode[0].state,
            country: gCode[0].country,
            postCode: gCode[0].zipcode,
            street: gCode[0].streetName,
            streetNumber: gCode[0].streetNumber,
          },
          latAndlon: `${gCode[0].longitude || 200} ${gCode[0].latitude || 201}`,
        };
        property.address = gCode[0]?.formattedAddress || '';
      }

      property.puid = uuid();
      property.managedBy = currentuser._id;
      await property.save();
      return {
        success: true,
        data: property,
        msg: 'Property has been successfully added.',
      };
    } catch (error: any) {
      this.log.error(color.bold.red(error));
      throw error;
    }
  };
}

export default PropertyService;
