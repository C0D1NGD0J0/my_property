import { Request, Response } from 'express';
import { AuthService } from '@services/user';
import { AUTH_EMAIL_QUEUE } from '@utils/constants';
import { EmailQueue } from '@services/queues';

class AuthController {
  private authService: AuthService;
  private emailQueue: EmailQueue;

  constructor() {
    this.authService = new AuthService();
    this.emailQueue = new EmailQueue();
  }

  signup = async (req: Request, res: Response) => {
    const { data, ...rest } = await this.authService.signup(req.body);
    this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data.emailOptions);
    res.status(200).json(rest);
  };
}

export default new AuthController();
