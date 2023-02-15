import express, { Application, Express } from 'express';
import { App as AppSetup } from './app';
import http from 'http';
import { createLogger } from '@utils/helperFN';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
const log = createLogger('ServerFile');

class Server {
  private app: AppSetup;
  private expApp: Application;
  private PORT = process.env.PORT || 5000;

  constructor() {
    this.expApp = express();
    this.app = new AppSetup(this.expApp);
  }

  start = (): void => {
    this.app.setupConfig();
    this.startServer(this.expApp);
  };

  getAppInstance = () => {
    return { server: this.expApp };
  };

  private async startServer(app: Application): Promise<void> {
    try {
      const _httpServer: http.Server = new http.Server(app);
      this.startHTTPServer(_httpServer);
    } catch (error) {
      log.error('Error: ', error.message);
    }
  }

  private startHTTPServer(httpServer: http.Server): void {
    if (process.env.NODE_ENV !== 'test') {
      httpServer.listen(this.PORT, () => {
        log.info(`Server is currently running on port ${this.PORT}`);
      });
    }

    // unhandled promise rejection
    process.once('unhandledRejection', (err: any) => {
      log.error(`Error: ${err.message}`);
      httpServer.close(() => process.exit(1));
    });
  }
}

const server = new Server();
server.start();
export const app = server.getAppInstance().server;
