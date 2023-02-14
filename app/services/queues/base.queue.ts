import Logger from 'bunyan';
import Queue, { Job } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';

import { createLogger } from '@utils/helperFN';
import { IEmailOptions } from '@interfaces/utils.interface';

type IBaseJobData = IEmailOptions;
let bullAdapters: BullAdapter[] = [];
export let serverAdapter: ExpressAdapter;

export abstract class BaseQueue {
  queue: Queue.Queue;
  log: Logger;

  constructor(queueName: string) {
    this.queue = new Queue(queueName, process.env.REDIS_URL as string);
    bullAdapters.push(new BullAdapter(this.queue));
    bullAdapters = [...new Set(bullAdapters)]; // this removes duplicates
    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues');

    createBullBoard({
      queues: bullAdapters,
      serverAdapter,
    });

    this.log = createLogger(`${queueName}:Queue`);

    this.queue.on('completed', (job: Job) => {
      job.remove();
      this.log.info(`Job ${job.id} has completed.`);
    });

    this.queue.on('global:stalled', (jobId: Job) => {
      this.log.info(`Job ${jobId} has stalled.`);
    });
  }

  protected addJobToQueue = (name: string, data: IBaseJobData): void => {
    this.queue.add(name, data, {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    });
  };

  protected processQueueJobs = (
    name: string,
    concurrency: number,
    cb: Queue.ProcessCallbackFunction<void>
  ): void => {
    this.queue.process(name, concurrency, cb);
  };
}
