import { Types } from 'mongoose';
import color from 'colors';
import dayjs from 'dayjs';

import { Lease, Property, Report, ReportComment } from '@models/index';
import S3FileUpload from '@services/external/s3.service';
import ErrorResponse from '@utils/errorResponse';
import { createLogger } from '@utils/helperFN';

class SubscriptionService {
  private log;

  constructor() {
    this.log = createLogger('SubscriptionService', true);
  }
}

export default SubscriptionService;
