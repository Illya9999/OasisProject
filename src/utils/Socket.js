const msgpack = require("msgpack-lite");
const WebSocket = require("uWebSockets.js");
const EventEmitter = require("eventemitter3");

//function verify
class Socket extends EventEmitter {
	constructor(port, gameServer) {
		super();
		let me = this;
		this.gameServer = gameServer;
		let admin = `${gameServer.config.adminQuery}=${gameServer.config.adminPass}`;
		this.sockets = [];
		let manager = gameServer.manager;
		let socket = (this.socket = new WebSocket.App()
			.ws("/*", {
				/* Options */
				compression: WebSocket.SHARED_COMPRESSOR,
				maxPayloadLength: 16 * 1024 * 1024,
				idleTimeout: 10,
				/* Handlers */
				upgrade: (res, req, context) => {
					console.log(gameServer.config.adminEnabled, req.getQuery(), admin)
					res.upgrade(
						{
							admin: gameServer.config.adminEnabled && req.getQuery() == admin
						},
						req.getHeader("sec-websocket-key"),
						req.getHeader("sec-websocket-protocol"),
						req.getHeader("sec-websocket-extensions"),
						context
					);
				},
				open: ws => {
					ws.subscribe("broadcast");
					ws.binaryType = "arraybuffer";
					ws.msgQueue = [];
					ws._send = ws.send;
					ws.broadcast = me.send;
					ws.send = function (e) {
						var t = Array.prototype.slice.call(arguments, 1),
							n = msgpack.encode([e, t]);
						try {
							if (ws.getBufferedAmount() < 1024) ws._send(n, !0);
							else ws.msgQueue.push(n);
						} catch (e) { }
					};
					ws.encode = function (e) {
						var t = Array.prototype.slice.call(arguments, 1);
						return msgpack.encode([e, t]);
					}
					ws.dc = (reason = "") => (console.log(reason), ws.end(1000, reason));
					me.sockets.push(ws);
					me.emit("connection", ws);
				},
				message: (ws, message, isBinary) => {
					if (!isBinary) return manager.close(ws, 'Kicked for hacks');
					let packetID, data;

					try {
						let p = new Uint8Array(message);
						[packetID, data] = msgpack.decode(p);
						if (ws.hasOwnProperty("packet" + packetID))
							ws["packet" + packetID](...data);
						else console.log(packetID), manager.close(ws, 'Kicked for hacks');
					} catch (e) {
						console.log(e);
						manager.close(ws, 'Kicked for attempting to crash')
					}
				},
				drain: ws => {
					while (ws.getBufferedAmount() < 1024 && ws.msgQueue.length)
						ws._send(ws.msgQueue.shift(), !0);
				},
				close: (ws, code, message) => {
					me.sockets.splice(this.sockets.indexOf(ws), 1);
					ws.closedSocket && ws.closedSocket();
				}
			}).get('/ping', (res, req) => {
				res.writeStatus('200 OK').writeHeader('Content-Type', 'application/json; charset=utf-8').end(JSON.stringify({ uptime: process.uptime(), players: this.sockets.length, software: 'Oasis' }));
			}).listen(port, token => {
				if (token) {
					console.log("Listening to port " + port);
				} else {
					console.log("Failed to listen to port " + port);
				}
			}));
		return this;
	}
	send(e) {
		//broadcast to all clients
		var t = Array.prototype.slice.call(arguments, 1),
			n = msgpack.encode([e, t]);
		this.sockets[0] && this.sockets[0].publish("broadcast", n, !0);
	}
}

module.exports = Socket;
