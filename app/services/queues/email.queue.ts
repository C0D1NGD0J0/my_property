import { AUTH_EMAIL_QUEUE } from '@utils/constants';
import { BaseQueue } from '@services/queues/base.queue';
import { IEmailOptions } from '@interfaces/utils.interface';
import { EmailWorker } from '@services/workers';

class EmailQueue extends BaseQueue {
  constructor() {
    super('emailQueue');
    this.processQueueJobs(AUTH_EMAIL_QUEUE, 5, new EmailWorker().sendmail);
  }

  addEmailToQueue(qname: string, data: IEmailOptions): void {
    this.addJobToQueue(qname, data);
  }
}

export default EmailQueue;
