/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
dotenv.config();
import express, { Application, Express, urlencoded } from 'express';
import cors from 'cors';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import db from '@database/index';
// import { errorHandler } from '@utils/middlewares';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';

// ROUTES
import authRoutes from '@routes/auth.route';
import { dbErrorHandler } from '@utils/middlewares';
import { createLogger } from '@utils/helperFN';

export class App {
  protected app: Application;
  private log;

  constructor(app: Application) {
    this.app = app;
    this.log = createLogger('MainApp');
  }

  setupConfig = (): Application => {
    this.databaseConnection();
    this.standardMiddleware(this.app);
    this.securityMiddleware(this.app);
    this.routes(this.app);
    this.appErroHandler(this.app);

    return this.app;
  };

  private databaseConnection(): void {
    if (process.env.NODE_ENV !== 'test') {
      db.connect();
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
    }
    app.use(express.json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));
    app.use(cookieParser());
    app.use(compression());
  }
  private routes(app: Application) {
    // app.use("/queues", serverAdapter.getRouter());
    app.use('/api/auth', authRoutes);
  }
  private appErroHandler(app: Application): void {
    app.use(dbErrorHandler);
    process.on('uncaughtException', (err: Error) => {
      this.log.error('There was an uncaught error exception: ', err.message);
      this.serverShutdown(1);
    });

    process.on('unhandledRejection', (err: Error) => {
      this.log.error('There was an unhandled rejection error: ', err.message);
      this.serverShutdown(2);
    });

    process.on('SIGTERM', (err: Error) => {
      this.log.error('There was a SIGTERM error: ', err.message);
    });
  }

  private serverShutdown(exitCode: number): void {
    Promise.resolve()
      .then(() => {
        this.log.info('Shutdown complete.');
        process.exit(exitCode);
      })
      .catch((error: Error) => {
        this.log.error('Error occured during shutdown: ', error.message);
        process.exit(1);
      });
  }
}
