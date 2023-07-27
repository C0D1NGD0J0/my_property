import { createLogger } from '@utils/helperFN';
import { BaseCache, ICacheResponse } from '@root/app/caching/base.cache';
import { ICurrentUser } from '@interfaces/user.interface';
import { IMaintenanceReportDocument } from '@interfaces/report.interface';
import { IComment, ICommentDocument } from '@interfaces/comment.interface';

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

  addComment = async (
    reportId: string | undefined,
    comment: ICommentDocument | null
  ): Promise<ICacheResponse | undefined> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (!reportId) {
        throw new Error('Error adding comment to cache, reportId missing.');
      }

      if (!comment || (comment && !comment.text)) {
        throw new Error('Error adding comment to cache, comment missing.');
      }

      const key = this.generateKey('reportComments', reportId);
      const resp = await this.client.RPUSH(key, JSON.stringify(comment));
      await this.client.EXPIRE(key, 300);

      return { success: !!resp };
    } catch (error) {
      if (error && error.message.includes('WRONGTYPE')) {
        console.error('Unable to add comment, invalid data structure.');
      } else {
        this.log.error('MaintenanceReport - addcomment cache error: ', error);
      }
    }
  };

  getComments = async (
    reportId: string | undefined,
    page = 1,
    pageSize = 10
  ): Promise<ICacheResponse | undefined> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (!reportId) {
        throw new Error('Error adding comment to cache, reportId missing.');
      }

      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      const key = this.generateKey('reportComments', reportId);
      const resp = await this.client.LRANGE(key, start, end);
      let comments = [];
      if (resp.length > 0) {
        comments = resp.map((c) => JSON.parse(c));
      }
      return { success: !!resp, data: comments };
    } catch (error) {
      if (error && error.message.includes('WRONGTYPE')) {
        console.error('Unable to getComments, invalid data structure.');
      } else {
        this.log.error('MaintenanceReport - getComments cache error: ', error);
      }
    }
  };
}
