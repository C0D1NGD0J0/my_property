import jwt from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@services/user';
import { EmailQueue } from '@services/queues';
import { httpStatusCodes, jwtGenerator, setCookieAuth } from '@utils/helperFN';
import {
  AUTH_EMAIL_QUEUE,
  PASSWORD_RESET_EMAIL,
  PASSWORD_RESET_SUCCESS,
} from '@utils/constants';
import { AuthCache } from '@services/redis';
import ErrorResponse from '@utils/errorResponse';

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
    res.status(httpStatusCodes.OK).json(rest);
  };

  accountActivation = async (req: Request, res: Response) => {
    const { token } = req.params;
    const data = await this.authService.accountActivation(token);
    res.status(httpStatusCodes.OK).json(data);
  };

  resendActivationLink = async (req: Request, res: Response) => {
    const { data, ...rest } = await this.authService.resendActivationLink(
      req.body.email
    );
    this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data!.emailOptions);
    res.status(httpStatusCodes.OK).json(rest);
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { data, ...rest } = await this.authService.login({
      email,
      password,
    });
    data && setCookieAuth(data.refreshToken, res);
    data &&
      this.cache.saveAuthTokens(data.userid, [
        data.accessToken,
        data.refreshToken,
      ]);
    res
      .status(httpStatusCodes.OK)
      .json({ ...rest, accessToken: data?.accessToken });
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const cookies = req.cookies;
    if (!cookies['refresh-token']) {
      return next(
        new ErrorResponse(
          'Access denied, please login again.',
          'authServiceError',
          httpStatusCodes.UNAUTHORIZED
        )
      );
    }

    const token = cookies['refresh-token'].split(' ')[1];

    const _decoded: any = jwt_decode(token);
    const resp = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET!,
      async (err: any, _tk: any) => {
        if (err) {
          console.log(err.message, '===ERROR====jwt');
          await this.cache.delAuthTokens(_decoded.id);
          res.clearCookie('refreshToken');
          return next(
            new ErrorResponse(
              'Access denied, please login again.',
              'authServiceError',
              httpStatusCodes.UNAUTHORIZED
            )
          );
        }

        const { accessToken, refreshToken } = jwtGenerator(_decoded.id);
        setCookieAuth(refreshToken, res);
        await this.cache.saveAuthTokens(_decoded.id, [
          accessToken,
          refreshToken,
        ]);
        return { success: true, accessToken };
      }
    );

    res.status(httpStatusCodes.OK).json(resp);
  };

  forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    const { data, ...rest } = await this.authService.forgotPassword(email);
    this.emailQueue.addEmailToQueue(PASSWORD_RESET_EMAIL, data!.emailOptions);
    res.status(httpStatusCodes.OK).json(rest);
  };

  resetPassword = async (req: Request, res: Response) => {
    const { data, ...rest } = await this.authService.resetPassword(req.body);
    this.emailQueue.addEmailToQueue(PASSWORD_RESET_SUCCESS, data!.emailOptions);
    res.status(httpStatusCodes.OK).json(rest);
  };
}

export default new AuthController();
