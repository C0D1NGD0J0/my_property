import Logger from 'bunyan';
import { DoneCallback, Job } from 'bull';

import Mailer from '@root/app/mailer';
import { createLogger } from '@utils/helperFN';
import { Invite } from '@models/index';

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

  sendUserInviteMail = async (job: Job, done: DoneCallback): Promise<void> => {
    const extractInviteId = (url: string) =>
      url.split('/validate-invite/')[1].split('?')[0];
    try {
      const data = job.data;
      const inviteId = extractInviteId(data.data.inviteUrl);
      await this.mailer.sendMail(data, data.emailType);
      job.progress(100);
      Invite.findOneAndUpdate(
        { id: inviteId },
        { $set: { sentAt: new Date() } },
        { new: true }
      );
      done(null, job.data);
    } catch (error) {
      log.error({ err: error });
      done(error as Error);
    }
  };
}
