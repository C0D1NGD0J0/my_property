import jwt from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import { NextFunction } from 'express';

import { AppRequest, AppResponse } from '@interfaces/utils.interface';
import { EmailQueue } from '@queues/index';
import { AuthService } from '@services/auth';
import ErrorResponse from '@utils/errorResponse';
import { AuthCache } from '@root/app/caching/index';
import { ICurrentUser } from '@interfaces/user.interface';
import { jwtGenerator, setCookieAuth } from '@utils/helperFN';
import { httpStatusCodes, AUTH_EMAIL_QUEUE } from '@utils/constants';

class AuthController {
  private authService: AuthService;
  private emailQueue: EmailQueue;
  private cache: AuthCache;

  constructor() {
    this.cache = new AuthCache();
    this.authService = new AuthService();
    this.emailQueue = new EmailQueue();
  }

  signup = async (req: AppRequest, res: AppResponse) => {
    const { data, ...rest } = await this.authService.signup(req.body);
    data &&
      this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data.emailOptions);
    res.status(httpStatusCodes.OK).json(rest);
  };

  accountActivation = async (req: AppRequest, res: AppResponse) => {
    const { token } = req.params;
    const data = await this.authService.accountActivation(token);
    res.status(httpStatusCodes.OK).json(data);
  };

  resendActivationLink = async (req: AppRequest, res: AppResponse) => {
    const { data, ...rest } = await this.authService.resendActivationLink(
      req.body.email
    );
    data &&
      this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data.emailOptions);
    res.status(httpStatusCodes.OK).json(rest);
  };

  login = async (req: AppRequest, res: AppResponse) => {
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

  logout = async (req: AppRequest, res: AppResponse) => {
    res.clearCookie('refreshToken');
    await this.cache.logoutUser((req.currentuser as ICurrentUser).id);
    res
      .status(httpStatusCodes.OK)
      .json({ success: true, msg: 'Logout was successful.' });
  };

  refreshToken = async (
    req: AppRequest,
    res: AppResponse,
    next: NextFunction
  ) => {
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
      process.env.JWT_REFRESH_SECRET as string,
      async (err: any, _: any) => {
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

  forgotPassword = async (req: AppRequest, res: AppResponse) => {
    const { email } = req.body;
    const { data, ...rest } = await this.authService.forgotPassword(email);
    data &&
      this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data.emailOptions);
    res.status(httpStatusCodes.OK).json(rest);
  };

  resetPassword = async (req: AppRequest, res: AppResponse) => {
    const { data, ...rest } = await this.authService.resetPassword(req.body);
    data &&
      this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data.emailOptions);
    res.status(httpStatusCodes.OK).json(rest);
  };
}

export default new AuthController();
