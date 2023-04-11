export const REFRESH_TOKEN = 'refresh-token';
export const FORGOT_PASSWORD = 'FORGOT_PASSWORD';
export const AUTH_EMAIL_QUEUE = 'AUTH_EMAIL_QUEUE';
export const USER_EMAIL_QUEUE = 'USER_EMAIL_QUEUE';
export const USER_INVITE_QUEUE = 'USER_INVITE_QUEUE';
export const USER_REGISTRATION = 'USER_REGISTRATION';
export const USER_INVITE_EMAIL = 'USER_INVITE_EMAIL';
export const PASSWORD_RESET_EMAIL = 'PASSWORD_RESET_EMAIL';
export const RESET_PASSWORD_SUCCESS = 'RESET_PASSWORD_SUCCESS';
export const PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS';
export const ACCOUNT_UPDATE_NOTIFICATION = 'ACCOUNT_UPDATE_NOTIFICATION';

export const httpStatusCodes = {
  OK: 200,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  UNPROCESSABLE: 422,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const errorTypes = {
  SERVICE_ERROR: 'serviceError',
  AUTH_ERROR: 'authError',
  DB_ERROR: 'dbError',
  NO_RESOURCE_ERROR: 'noResourceError',
  VALIDATION_ERROR: 'validationError',
};
