export default class ErrorResponse extends Error {
  statusCode: number;
  type: string;
  constructor(message: string, statusCode: number, type: string) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
  }
}
