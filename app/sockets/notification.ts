import { Server } from 'socket.io';

let socketIONotificationObject: Server;

export class SocketIONotificationObject {
  private io: Server;

  constructor(IO: Server) {
    this.io = IO;
  }

  public listen(): void {
    socketIONotificationObject = this.io;
  }
}

export { socketIONotificationObject };
