import Logger from 'bunyan';
import { DoneCallback, Job } from 'bull';

import Mailer from '@services/mailer';
import { createLogger } from '@utils/helperFN';

const log: Logger = createLogger('emailWorker', true);

export default class EmailWorker {
  mailer: Mailer;

  constructor() {
    this.mailer = new Mailer();
  }

  sendmail = async (job: Job, done: DoneCallback): Promise<void> => {
    try {
      const data = job.data;
      await this.mailer.sendMail(data, data.emailType);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error({ err: error });
      done(error as Error);
    }
  };
}
