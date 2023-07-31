import { Server, Socket } from 'socket.io';
import { ICommentDocument } from '@interfaces/comment.interface';

let socketIOCommentObject: Server;

export class SocketIOCommentObject {
  private io: Server;

  constructor(IO: Server) {
    this.io = IO;
    socketIOCommentObject = IO;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('add:comment', (data: ICommentDocument) => {
        this.io.emit('comment:added', data);
      });

      socket.on('delete:comment', (data: ICommentDocument) => {
        this.io.emit('comment:deleted', data);
      });
    });
  }
}

export { socketIOCommentObject };
