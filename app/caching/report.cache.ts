import { createLogger } from '@utils/helperFN';
import { BaseCache, ICacheResponse } from '@root/app/caching/base.cache';
import { ICurrentUser } from '@interfaces/user.interface';
import { IMaintenanceReportDocument } from '@interfaces/report.interface';
import { IComment } from '@interfaces/comment.interface';

export default class MaintenanceReportCache extends BaseCache {
  private cachekey: string;

  constructor() {
    super('reportCache');
    this.cachekey = 'reports';
    this.log = createLogger('reportCache');
  }

  createReport = async (
    report: IMaintenanceReportDocument | null
  ): Promise<ICacheResponse> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (!report) {
        throw new Error('Error adding report to cache.');
      }

      const key = this.generateKey(this.cachekey, report.id);
      return await this.setObject(
        key,
        {
          ...report,
          comments: [],
        },
        300
      );
    } catch (error) {
      this.log.error('MaintenanceReport cache error: ', error);
      throw {
        msg: error.message,
        errorType: 'cacheError',
      };
    }
  };

  getReport = async (
    reportId: string | undefined
  ): Promise<ICacheResponse<{ data: IMaintenanceReportDocument }>> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (!reportId) {
        throw new Error('Error report-id not provided.');
      }

      const key = this.generateKey(this.cachekey, reportId);
      return await this.getObject(key);
    } catch (error) {
      this.log.error('MaintenanceReport cache error: ', error);
      throw {
        msg: error.message,
        errorType: 'cacheError',
      };
    }
  };
}
