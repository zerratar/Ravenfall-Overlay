export default class WebSocketClient {
    constructor(url) {
      this.url = url;
      this.packetHandler = new PacketHandler();
      this.connectionSuccess = null;
      this.connectionFailed = null;
      this.connectedToServer = false;
      this.connectionPromise = new Promise(
        resolve => this.connectionSuccess = resolve,
        reject => this.connectionFailed = reject
      );
    }
  
    connectAsync() {
      if (this.connectedToServer) {
        return null;
      }
  
      try {
        if (this.socket && this.socket.readyState !== this.socket.CLOSED) {
          this.socket.close();
        }
      } catch (err) {}
  
      this.socket = new WebSocket(this.url);
      this.socket.onopen = () => this.onConnectionOpen();
      this.socket.onclose = () => this.onConnectionClose();
      this.socket.onmessage = msg => this.onMessageReceived(msg);
      this.socket.onerror = () => this.onError();
      this.socket.open();
  
      return this.connectionPromise;
    }
    
    onMessageReceived(msg) {
      const data = msg.data;
      const packet = JSON.parse(data);
      this.parsePacket(packet);
    }
  
    onConnectionOpen() {
      console.log("connection open");
      this.connectedToServer = true;
      this.connectionSuccess(true);
    }
  
    onConnectionClose() {
      console.log("connection closed");
      this.connectedToServer = false;
  
      setTimeout(async () => {
        await this.connectAsync();
      }, 1000);
  
    }
  
    onError() {
      console.error("ERRRORROROROROOR!");
      this.connectedToServer = false;
      this.connectionSuccess(false);
  
      setTimeout(async () => {
        await this.connectAsync();
      }, 5000);
    }
  
    parsePacket(packet) {
      const type = packet.header;
      const payload = packet.data;
      this.packetHandler.invoke(type, payload);
    }
  
    subscribe(packetId, onPacketReceived) {
      this.packetHandler.subscribe(packetId, onPacketReceived);
    }
  
    get serverPort() {
      return window.location.port;
      //return 8081;
    }
  
    get connected() {
      return this.connectedToServer;
    }
  }
  
  export class PacketHandler {
  
    constructor() {
      this.subscriptions = [];
    }
  
    invoke(packetId, packet) {
      const subs = this.subscriptions.filter(x => x.key == packetId);
      if (subs.length > 0) {
        subs.forEach(x => x.invoke(packet));
      } else {
        console.log(`No packet handler subscribed to ${packetId} :(`);
      }
    }
  
    subscribe(packetId, onPacketReceived) {
      this.subscriptions.push(new PacketSubscription(this, packetId, onPacketReceived));
    }
  
    unsubscribe(subscription) {
      this.subscriptions = this.subscriptions.filter(x => x.key != subscription.key);
    }
  }
  
  export class PacketSubscription {
    constructor(subject, key, onAction) {
      this.subject = subject;
      this.key = key;
      this.onAction = onAction;
    }
  
    invoke(packet) {
      if (this.onAction) this.onAction(packet);
    }
  
    unsubscribe() {
      this.subject.unsubscribe(this);
    }
  }