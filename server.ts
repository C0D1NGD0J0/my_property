import express, { Application, Express } from 'express';
import { App as AppSetup } from './app';
import http from 'http';
import { createLogger } from '@utils/helperFN';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
const log = createLogger('ServerFile');

export class Server {
  private PORT = process.env.PORT || 5000;
  private app: AppSetup;
  private expApp: Application;

  constructor() {
    this.expApp = express();
    this.app = new AppSetup(this.expApp);
  }

  start = (): void => {
    this.app.setupConfig();
    this.startServer(this.expApp);
  };

  getServerInstance() {
    return this.app ? this.app : null;
  }

  private async startServer(app: Application): Promise<any> {
    try {
      const httpServer: http.Server = new http.Server(app);

      this.startHTTPServer(httpServer);
      const socketIO: SocketIOServer = await this.createSocketServer(
        httpServer
      );
      this.socketIOConnections(socketIO);
    } catch (error) {
      log.error('Error: ', error.message);
    }
  }

  private createSocketServer = async (
    httpServer: http.Server
  ): Promise<SocketIOServer> => {
    const io: SocketIOServer = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      },
    });

    const pubClient = createClient({
      url: process.env.REDIS_URL,
    });
    const subClient = pubClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));
    return io;
  };

  private startHTTPServer(httpServer: http.Server): void {
    httpServer.listen(this.PORT, () => {
      log.info(`Server is currently running on port ${this.PORT}`);
    });

    // unhandled promise rejection
    process.once('unhandledRejection', (err: any) => {
      log.error(`Error: ${err.message}`);
      httpServer.close(() => process.exit(1));
    });
  }

  private socketIOConnections = (io: SocketIOServer): void => {};
}

const server = new Server();
server.start();

export const serverInstance = server.getServerInstance();
