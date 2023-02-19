import { Request, Response } from 'express';
import { AuthService } from '@services/user';
import { EmailQueue } from '@services/queues';
import { setCookieAuth } from '@utils/helperFN';
import { AUTH_EMAIL_QUEUE } from '@utils/constants';
import { AuthCache } from '@services/redis';

class AuthController {
  private authService: AuthService;
  private emailQueue: EmailQueue;
  private cache: AuthCache;

  constructor() {
    this.cache = new AuthCache();
    this.authService = new AuthService();
    this.emailQueue = new EmailQueue();
  }

  signup = async (req: Request, res: Response) => {
    const { data, ...rest } = await this.authService.signup(req.body);
    this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data!.emailOptions);
    res.status(200).json(rest);
  };

  accountActivation = async (req: Request, res: Response) => {
    const { token } = req.params;
    const data = await this.authService.accountActivation(token);
    res.status(200).json(data);
  };

  resendActivationLink = async (req: Request, res: Response) => {
    const { data, ...rest } = await this.authService.resendActivationLink(
      req.body.email
    );
    this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data!.emailOptions);
    res.status(200).json(rest);
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { data, ...rest } = await this.authService.login({
      email,
      password,
    });
    data && setCookieAuth(data.refreshJWT, res);
    data && this.cache.setRefreshToken(data.userid, data.refreshJWT);
    res.status(200).json({ ...rest, accessToken: data?.jwtToken });
  };

  // refreshToken = async (req: Request, res: Response) => {
  //   const cookies = req.cookies;
  //   if (!cookies.authToken) return res.status(401).json({ success: false });

  //   const data = await this.authService.getRefreshToken(cookies.authToken, res);
  //   res.status(200).json(data);
  // };

  // forgotPassword = async (req: Request, res: Response) => {
  //   const { email } = req.body;
  //   const data = await this.authService.forgotPassword(email);
  //   emailQueue.addToQueue(AUTH_EMAIL_JOB, {data: data?.emailOptions});
  //   res.status(200).json({success: true, message: data?.message });
  // };

  // resetPassword = async (req: Request, res: Response) => {
  //   const data = await this.authService.resetPassword(req.body);
  //   res.status(200).json(data);
  // };
}

export default new AuthController();
