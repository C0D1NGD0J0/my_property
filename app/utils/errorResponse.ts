export interface IErrorResponse {
  message: string;
  statusCode: number;
  type: string;
}

export default class ErrorResponse extends Error {
  statusCode: number;
  type: string;

  constructor(message: string, type: string, statusCode?: number) {
    super(message);
    this.type = type;
    this.statusCode = statusCode ? statusCode : 500;
  }
}
