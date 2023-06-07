export default class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.isConnecting = false;
    this.broadcasterId = null;
    this.sessionId = null;
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
    if (this.isConnecting == true) {
      return null;
    }

    if (this.connectedToServer) {
      console.warn('You\'re already connected to the server.');
      return null;
    }

    if (!this.canConnect) {
      console.error('You must first call setSessionId and setBroadcsterId before you can connect.');
      return null;
    }

    if (this.socket != null) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      try {
        if (this.socket && this.socket.readyState !== this.socket.CLOSED) {
          this.socket.close();
          console.warn('Force closed existing websocket to make a new one.');
        }
      } catch (err) {}
      this.socket = null;
    }

    this.isConnecting = true;
    this.socket = new WebSocket(this.url + '/' + this.broadcasterId + '/' + this.sessionId);
    this.socket.onopen = () => this.onConnectionOpen();
    this.socket.onclose = (e) => this.onConnectionClose(e);
    this.socket.onmessage = msg => this.onMessageReceived(msg);
    this.socket.onerror = () => this.onError();
    // this.socket.open();

    return this.connectionPromise;
  }

  onMessageReceived(msg) {
    const data = msg.data;
    const packet = JSON.parse(data);
    this.parsePacket(packet);
  }

  onConnectionOpen() {
    console.log("connection open");
    this.isConnecting = false;
    this.connectedToServer = true;
    this.connectionSuccess(true);
  }

  onConnectionClose(event) {
    console.log("connection closed");
    this.isConnecting = false;
    this.connectedToServer = false;


    let reason;
    // See https://www.rfc-editor.org/rfc/rfc6455#section-7.4.1
    if (event.code == 1000)
      reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
    else if (event.code == 1001)
      reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
    else if (event.code == 1002)
      reason = "An endpoint is terminating the connection due to a protocol error";
    else if (event.code == 1003)
      reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
    else if (event.code == 1004)
      reason = "Reserved. The specific meaning might be defined in the future.";
    else if (event.code == 1005)
      reason = "No status code was actually present.";
    else if (event.code == 1006)
      reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
    else if (event.code == 1007)
      reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [https://www.rfc-editor.org/rfc/rfc3629] data within a text message).";
    else if (event.code == 1008)
      reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
    else if (event.code == 1009)
      reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
    else if (event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
      reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
    else if (event.code == 1011)
      reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
    else if (event.code == 1015)
      reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
    else
      reason = "Unknown reason";


    this.packetHandler.invoke('close', {
      sessionEnded: !!this.streamerClosedGame,
      reason: event.code + ' ' + reason,
      code: event.code
    });

    // if (this.autoReconnect === true) {
    //   setTimeout(async () => {
    //     await this.connectAsync();
    //   }, 1000);
    // }
  }

  setSessionId(sessionId) {
    const previousSessionId = this.sessionId;
    this.sessionId = sessionId;
    if (previousSessionId != sessionId && this.connectedToServer) {
      this.close();
    }
  }

  setBroadcasterId(broadcasterId) {
    this.broadcasterId = broadcasterId;
  }

  onError() {
    this.connectedToServer = false;
    this.isConnecting = false;
    this.connectionSuccess(false);

    // if (this.autoReconnect === true) {
    //   setTimeout(async () => {
    //     await this.connectAsync();
    //   }, 5000);
    // }
  }

  parsePacket(packet) {
    const type = packet.header;
    const payload = packet.data;
    this.packetHandler.invoke(type, payload);
  }

  subscribe(packetId, onPacketReceived) {
    this.packetHandler.subscribe(packetId, onPacketReceived);
  }

  close(streamerClosedGame = false) {
    if (!this.connectedToServer) {
      return;
    }
    this.streamerClosedGame = streamerClosedGame;
    this.connectedToServer = false;
    try {
      if (this.socket && this.socket.readyState !== this.socket.CLOSED) {
        this.socket.close(); // 4000, 'Connection closed due to sessionId changed.'
      }
    } catch (err) {}
  }

  get canConnect() {
    return this.broadcasterId != null && this.sessionId != null && this.connectedToServer == false;
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