export class Player {
  constructor(id, name, socketId, isAdmin = false) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.isAdmin = isAdmin;
  }
}