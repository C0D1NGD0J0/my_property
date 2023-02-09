/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
dotenv.config();
import express, { Application, Express, urlencoded } from 'express';
import cors from 'cors';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import { connectDB } from './app/database';
import { errorHandler } from './app/utils/middlewares';
import helmet from "helmet";
import hpp from "hpp";
import compression from "compression";

// ROUTES
import authRoutes from './app/routes/auth.route';

export class App {
  protected app: Application;
  
  constructor(app: Application) {
    this.app = app;
  };

  setupConfig = (): Application => {
    this.databaseConnection();
    this.standardMiddleware(this.app);
    this.securityMiddleware(this.app);
    this.routes(this.app);
    this.globalErroHandler(this.app);

    return this.app
  }

  private databaseConnection(): void {
    if (process.env.NODE_ENV !== 'test') {
      connectDB();
    }
  }
  private securityMiddleware(app: Application): void {
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: ['*', process.env.FRONTEND_URL as string],
        optionsSuccessStatus: 200,
        credentials: true,
      })
    );
  }
  private standardMiddleware(app: Application): void {
    if (process.env.NODE_ENV !== 'production') {
      app.use(logger('dev'));
    };
    app.use(express.json({limit: '50mb'}));
    app.use(urlencoded({extended: true, limit: '50mb'}));
    app.use(cookieParser());
    app.use(compression());
  }  
  private routes(app: Application) {
    app.use("/queues", serverAdapter.getRouter());
    app.use('/api/auth', authRoutes);
  }
  private globalErroHandler(app: Application): void {
    app.use(errorHandler);
  }
};
