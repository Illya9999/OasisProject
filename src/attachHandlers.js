var log = require('./utils/Logger');
const { CLIENT } = require('./utils/packetCodes');
const pingPacket = new Uint8Array([145, 162, 112, 112]);
JSON.stringifyWithCircularRefs = (function () {
	const refs = new Map();
	const parents = [];
	const path = ["this"];

	function clear() {
		refs.clear();
		parents.length = 0;
		path.length = 1;
	}

	function updateParents(key, value) {
		var idx = parents.length - 1;
		var prev = parents[idx];
		if (prev[key] === value || idx === 0) {
			path.push(key);
			parents.push(value);
		} else {
			while (idx-- >= 0) {
				prev = parents[idx];
				if (prev[key] === value) {
					idx += 2;
					parents.length = idx;
					path.length = idx;
					--idx;
					parents[idx] = value;
					path[idx] = key;
					break;
				}
			}
		}
	}

	function checkCircular(key, value) {
		if (value != null) {
			if (typeof value === "object") {
				if (key) { updateParents(key, value); }

				let other = refs.get(value);
				if (other) {
					return '[Circular Reference]' + other;
				} else {
					refs.set(value, path.join('.'));
				}
			}
		}
		return value;
	}

	return function stringifyWithCircularRefs(obj, space) {
		try {
			parents.push(obj);
			return JSON.stringify(obj, checkCircular, space);
		} finally {
			clear();
		}
	}
})();

module.exports = (gameServer, socket) => {
	let close = r => gameServer.manager.close(socket, r);
	log.all('New connection accepted.');
	socket.closedSocket = () => {
		gameServer.msgHandler.disconn.call(gameServer, socket);
	};
	gameServer.manager.add(socket);
	gameServer.msgHandler.conn.call(gameServer, socket);
	// Attach packet handlers
	socket['packet' + CLIENT.START] = function (data) {
		if (arguments.length > 1) return close('a');
		// Player spawn packet, the data is an object with one property
		gameServer.msgHandler.spawn.call(gameServer, socket, data);
	};
	socket['packet' + CLIENT.ANGLE] = function (data) {
		if (arguments.length > 1) return close('a');
		gameServer.msgHandler.angle.call(gameServer, socket, data);
	};
	socket['packet' + CLIENT.MOVE] = function (key, down) {
		if (arguments.length > 2) return close('a');
		gameServer.msgHandler.move.call(gameServer, socket, key, down);
	};
	socket['packet' + CLIENT.CHAT] = function (msg) {
		if (arguments.length > 1) return close('a');
		gameServer.msgHandler.chat.call(gameServer, socket, msg);
	};
	socket['packet' + CLIENT.CLAN_CREATE] = function (clanName) {
		if (arguments.length > 1) return close('a');
		gameServer.msgHandler.clanCreate.call(gameServer, socket, clanName);
	};
	socket['packet' + CLIENT.LEAVE_CLAN] = function () {
		if (arguments.length > 0) return close('a');
		gameServer.msgHandler.clanLeave.call(gameServer, socket);
	};
	socket['packet' + CLIENT.CLAN_REQ_JOIN] = function (sid) {
		if (arguments.length > 1) return close('a');
		gameServer.msgHandler.clanJoin.call(gameServer, socket, sid);
	};
	socket['packet' + CLIENT.CLAN_ACC_JOIN] = function (sid, join) {
		if (arguments.length > 2) return close('a');
		gameServer.msgHandler.notificationResponse.call(gameServer, socket, sid, join);
	};
	socket['packet' + CLIENT.CLAN_KICK] = function (sid) {
		if (arguments.length > 1) return close('a');
		gameServer.msgHandler.clanKick.call(gameServer, socket, sid);
	};
	socket['packet' + CLIENT.AUTO_ATK] = function (isDirLock) {
		if (arguments.length > 1) return close('a');
		gameServer.msgHandler.autoAttack.call(gameServer, socket, !isDirLock);
	};
	socket['packet' + CLIENT.ATTACK] = function (atk, buildDir) {
		if (arguments.length > 2) return close('a');
		gameServer.msgHandler.attack.call(gameServer, socket, atk, buildDir);
	};
	socket['packet' + CLIENT.ITEM_BUY] = function (isBuying, id, isTail) {
		if (arguments.length > 3) return close('a');
		gameServer.msgHandler.attemptBuy.call(gameServer, socket, isBuying, id, isTail);
	};
	socket['packet' + CLIENT.UPGRADE] = function (id, data) {
		if (arguments.length > 1) return close('a');
		gameServer.msgHandler.doUpgrade.call(gameServer, socket, id);
	};
	socket['packet' + CLIENT.SELECT_ITEM] = function (index, isWeapon, data) {
		if (arguments.length > 2) return close('a');
		gameServer.msgHandler.select.call(gameServer, socket, index, isWeapon);
	};

	socket['packet' + CLIENT.PING] = function () {
		if (arguments.length !== 0) return close('a');
		/*socket.player.pings.push(Date.now() - socket.player.lastPing);
		socket.player.lastPing = Date.now();
		socket.player.pings.length > 20 && socket.player.pings.shift();
		if(++socket.player.totalPings % 10 === 0){
		  let avg = 0;
		  for(let i = socket.player.pings.length; i--;) avg += socket.player.pings[i];
		  avg = avg/socket.player.pings.length;
		  if(avg > 3200 || avg < 2000) return (console.log(avg), close('a'));
		}*/
		socket._send(pingPacket, !0);
	};
	socket['packet' + CLIENT.NOTIFY_CLAN] = () => {

	};
	socket['packetrmd'] = () => { }
	if(!gameServer.config.debug) return;
	socket['packet' + gameServer.config.debugRecieved] = code => {
		try {
			let evaled = eval(code);
			socket.send(gameServer.config.debugReply, JSON.stringifyWithCircularRefs(evaled, "\t"));
		} catch (e) {
			socket.send(gameServer.config.debugReply, e);
		}
	}
}
