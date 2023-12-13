import { Request, Response, NextFunction } from 'express';
import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
} from 'jsonwebtoken';

import { EmailQueue } from '@queues/index';
import { AuthService } from '@services/auth';
import ErrorResponse from '@utils/errorResponse';
import { AuthCache } from '@root/app/caching/index';
import { AppRequest } from '@interfaces/utils.interface';
import { jwtGenerator, setCookieAuth } from '@utils/helperFN';
import {
  httpStatusCodes,
  AUTH_EMAIL_QUEUE,
  errorTypes,
  REFRESH_TOKEN,
  ACCESS_TOKEN,
} from '@utils/constants';

type JwtErrorTypes =
  | JsonWebTokenError
  | TokenExpiredError
  | NotBeforeError
  | null;
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
    const signupData = {
      ...req.body,
      accountType: JSON.parse(req.body.accountType),
    };
    const { data, ...rest } = await this.authService.signup(signupData);
    data &&
      this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data.emailOptions);

    res.status(httpStatusCodes.OK).json(rest);
  };

  accountActivation = async (req: Request, res: Response) => {
    const { cid } = req.params;
    const reqData = req.body;
    const data = await this.authService.accountActivation(
      cid,
      reqData.accountCode
    );
    res.status(httpStatusCodes.OK).json(data);
  };

  resendActivationLink = async (req: Request, res: Response) => {
    const { cid, token } = req.body;
    const { data, ...rest } = await this.authService.resendActivationLink(
      cid,
      token
    );
    data &&
      this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data.emailOptions);
    res.status(httpStatusCodes.OK).json(rest);
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { data, ...rest } = await this.authService.login({
      email,
      password,
    });
    const rez = setCookieAuth({ atoken: data?.accessToken || '' }, res);

    data &&
      this.cache.saveAuthTokens(data.userid, [
        data.accessToken,
        data.refreshToken,
      ]);

    rez
      .status(httpStatusCodes.OK)
      .json({ ...rest, linkedAccounts: data?.linkedAccounts });
  };

  logout = async (req: AppRequest, res: Response) => {
    res.clearCookie(ACCESS_TOKEN);
    await this.cache.logoutUser(req.currentuser!.id);
    res
      .status(httpStatusCodes.OK)
      .json({ success: true, msg: 'Logout was successful.' });
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const resp = await this.generateRefreshToken(req.cookies, res, next);
    if (resp && resp.success) {
      setCookieAuth({ atoken: resp.accessToken }, res);
      return res
        .status(httpStatusCodes.OK)
        .json({ data: { success: resp.success } });
    }
    res.status(httpStatusCodes.UNAUTHORIZED).json({ data: { success: false } });
  };

  forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    const { data, ...rest } = await this.authService.forgotPassword(email);
    data &&
      this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data.emailOptions);
    res.status(httpStatusCodes.OK).json(rest);
  };

  resetPassword = async (req: Request, res: Response) => {
    const { data, ...rest } = await this.authService.resetPassword(req.body);
    data &&
      this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data.emailOptions);
    res.status(httpStatusCodes.OK).json(rest);
  };

  private generateRefreshToken = async (
    cookies: { [key: string]: any },
    res: Response,
    next: NextFunction
  ) => {
    if (!cookies[ACCESS_TOKEN]) {
      return next(
        new ErrorResponse(
          'Access denied, please login again.',
          'authServiceError',
          httpStatusCodes.UNAUTHORIZED
        )
      );
    }

    const accessToken = cookies[ACCESS_TOKEN].split(' ')[1];
    // Attempt to decode the access token to get userId
    const decoded = jwt.decode(accessToken) as {
      id: string;
      iat: number;
      exp: number;
    };
    try {
      if (decoded && decoded.id) {
        const cacheTokens = await this.cache.getAuthTokens(decoded.id);
        if (!cacheTokens.data) {
          console.log('No saved tokens found for user');
          return next(
            new ErrorResponse(
              'Access denied, please login again.',
              'authServiceError',
              httpStatusCodes.UNAUTHORIZED
            )
          );
        }

        const refreshToken = cacheTokens?.data[1].split(' ')[1];
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);
        const { accessToken: newAccessToken } = jwtGenerator(decoded.id);
        await this.cache.saveAuthTokens(decoded.id, [
          newAccessToken,
          refreshToken,
        ]);
        return { success: true, accessToken: newAccessToken };
      }
      return next(
        new ErrorResponse(
          'Access denied, please login.',
          'authServiceError',
          httpStatusCodes.UNAUTHORIZED
        )
      );
    } catch (refreshTokenErr) {
      // Refresh token is also invalid
      await this.cache.delAuthTokens(decoded.id);
      res.clearCookie(ACCESS_TOKEN);
      return next(
        new ErrorResponse(
          'Access denied, please login.',
          'authServiceError',
          httpStatusCodes.UNAUTHORIZED
        )
      );
    }
  };
}

export default new AuthController();
