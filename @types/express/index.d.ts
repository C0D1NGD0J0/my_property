import express from 'express';
import { ICurrentUser } from '../../app/interfaces/user.interface';

declare global {
  namespace Express {
    export interface Request {
      currentuser: ICurrentUser;
    }

    export interface Response {
      error?: any;
    }
  }
}
