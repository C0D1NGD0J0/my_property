import express, { Application, Express } from 'express';
import { App as AppSetup } from './app';
import http from 'http';
import { createLogger } from '@utils/helperFN';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { SocketIONotificationObject } from './app/sockets/notification';
import { SocketIOCommentObject } from '@sockets/comments';
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
      const socketIO: SocketIOServer = await this.setupSocketIO(_httpServer);
      await this.createSocketConnections(socketIO);
    } catch (error) {
      log.error('Error: ', error.message);
    }
  }

  private async setupSocketIO(
    httpServer: http.Server
  ): Promise<SocketIOServer> {
    const io: SocketIOServer = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST'],
      },
    });

    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
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

  private async createSocketConnections(io: SocketIOServer): Promise<void> {
    // to do
    // add authentication
    // create chat room for each report chat session

    const notificationHandler: SocketIONotificationObject =
      new SocketIONotificationObject(io);
    const reportCommentsHandler: SocketIOCommentObject =
      new SocketIOCommentObject(io);

    reportCommentsHandler.listen();
    notificationHandler.listen();
  }
}

const server = new Server();
server.start();
export const app = server.getAppInstance().server;
