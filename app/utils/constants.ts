export const REFRESH_TOKEN = 'refreshToken';
export const ACCESS_TOKEN = 'accessToken';
export const FORGOT_PASSWORD = 'FORGOT_PASSWORD';
export const AUTH_EMAIL_QUEUE = 'AUTH_EMAIL_QUEUE';
export const USER_EMAIL_QUEUE = 'USER_EMAIL_QUEUE';
export const USER_INVITE_QUEUE = 'USER_INVITE_QUEUE';
export const USER_REGISTRATION = 'USER_REGISTRATION';
export const USER_INVITE_EMAIL = 'USER_INVITE_EMAIL';
export const PASSWORD_RESET_EMAIL = 'PASSWORD_RESET_EMAIL';
export const RESET_PASSWORD_SUCCESS = 'RESET_PASSWORD_SUCCESS';
export const PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS';
export const ACCOUNT_SUCCESS_EMAIL = 'ACCOUNT_SUCCESS_EMAIL';
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
  CUSTOM_UNAUTHORIZED: 419,
};

export const errorTypes = {
  DB_ERROR: 'dbError',
  AUTH_ERROR: 'authError',
  SERVICE_ERROR: 'serviceError',
  BAD_REQUEST_ERROR: 'requestError',
  NO_RESOURCE_ERROR: 'noResourceError',
  VALIDATION_ERROR: 'validationError',
};

export const stripeSupportedCountries = [
  { name: 'Germany', code: 'DE' },
  { name: 'Australia', code: 'AU' },
  { name: 'Austria', code: 'AT' },
  { name: 'Belgium', code: 'BE' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Bulgaria', code: 'BG' },
  { name: 'Canada', code: 'CA' },
  { name: 'Cyprus', code: 'CY' },
  { name: 'Croatia', code: 'HR' },
  { name: 'Denmark', code: 'DK' },
  { name: 'United Arab Emirates', code: 'AE' },
  { name: 'Slovakia', code: 'SK' },
  { name: 'Slovenia', code: 'SI' },
  { name: 'Spain', code: 'ES' },
  { name: 'United States', code: 'US' },
  { name: 'Estonia', code: 'EE' },
  { name: 'Finland', code: 'FI' },
  { name: 'France', code: 'FR' },
  { name: 'Gibraltar', code: 'GI' },
  { name: 'Greece', code: 'GR' },
  { name: 'Hong Kong', code: 'HK' },
  { name: 'Hungary', code: 'HU' },
  { name: 'India', code: 'IN' },
  { name: 'Indonesia', code: 'ID' },
  { name: 'Ireland', code: 'IE' },
  { name: 'Italy', code: 'IT' },
  { name: 'Japan', code: 'JP' },
  { name: 'Latvia', code: 'LV' },
  { name: 'Liechtenstein', code: 'LI' },
  { name: 'Lithuania', code: 'LT' },
  { name: 'Luxembourg', code: 'LU' },
  { name: 'Malaysia', code: 'MY' },
  { name: 'Malta', code: 'MT' },
  { name: 'Mexico', code: 'MX' },
  { name: 'Norway', code: 'NO' },
  { name: 'New Zealand', code: 'NZ' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'Poland', code: 'PL' },
  { name: 'Portugal', code: 'PT' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Czech Republic', code: 'CZ' },
  { name: 'Romania', code: 'RO' },
  { name: 'Singapore', code: 'SG' },
  { name: 'Sweden', code: 'SE' },
  { name: 'Switzerland', code: 'CH' },
  { name: 'Thailand', code: 'TH' },
];
