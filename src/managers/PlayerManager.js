var Player = require("../entities/Player");
var log = require("../utils/Logger");
const { SERVER } = require("../utils/packetCodes");
class PlayerManager {
	addPlayer(socket, player) {
		socket.send(SERVER.PLAYER_ADD, player.player.getData(), false);
	}
	addSelfPlayer(socket) {
		socket.send(SERVER.PLAYER_ADD, socket.player.getData(), true);
	}
	sendRawUpdate(socket, rawData) {
		socket.send(SERVER.PLAYER_UPDATE, rawData);
	}
	removeIndex(i) {
		let me = this;
		if (!me.players) me = this.GameServer.manager;
		clearInterval(me.players[i].player.tickInterval);
		clearInterval(me.players[i].player.cacheInterval);
		clearInterval(me.players[i].player.dotInterval);
		me.players[i] = void 0;
		me.realPlayers = me.players.filter(e => e);
	}
	sendStart(socket, id) {
		socket.send(SERVER.PLAYER_SET_ID, id || socket.player.sid);
	}
	sendChat(source, recipient, msg) {
		recipient.send(SERVER.PLAYER_CHAT, source.player.sid, msg);
	}
	sendObj(socket, data) {
		socket.send(SERVER.LOAD_GAME_OBJ, data);
	}
	updateStore(socket, type, storeId, isTail) {
		socket.send(SERVER.UPDATE_STORE_ITEMS, type, storeId, isTail);
	}
	sendUpgrades(socket, upgradePoints, age) {
		socket.send(SERVER.UPGRADES, upgradePoints, age);
	}
	hideUpgrades(socket) {
		this.sendUpgrades(socket, 0, 0);
	}
	syncPlayerItems(socket) {
		socket.send(SERVER.UPDATE_ACTION_BAR, socket.player.items, 0);
		socket.send(SERVER.UPDATE_ACTION_BAR, socket.player.weapons, 1);
	}
	playerAge(socket) {
		this.sendUpgrades(
			socket,
			socket.player.upgradePoints,
			socket.player.upgrAge
		);
	}
	sendAttack(to, from, hit) {
		var wcode = from.player.weaponCode;
		//if (wcode == 1)
		//wcode = 0;
		// Emit attack
		to.send(SERVER.GATHER_ANIM, from.player.sid, hit, wcode);
	}
	updateStat(socket, statName, statValue, updateUI) {
		socket.send(SERVER.STAT_UPDATE, statName, statValue, updateUI | 0);
	}
	updateXP(socket) {
		socket.send(SERVER.UPDATE_AGE, socket.player.xp, socket.player.maxXP, socket.player.age);
	}
	updateMaterials(socket) {
		this.updateStat(socket, "stone", socket.player.stone, true);
		this.updateStat(socket, "wood", socket.player.wood, true);
		this.updateStat(socket, "food", socket.player.food, true);
		this.updateStat(socket, "points", socket.player.points, true);
		this.updateStat(socket, "kills", socket.player.kills, true);
		this.updateXP(socket);
	}
	updateHealth(socket, amount = 0) {
		amount && socket.send(SERVER.DAMAGED_TEST, socket.player.x | 0, socket.player.y | 0, Math.round(-amount),1);
		var near = socket.player.allNear;
		for (var i = 0; i < near.length; ++i) near[i].send(SERVER.UPDATE_HEALTH, socket.player.sid, socket.player.health);
	}
	kill(socket) {
		//is this even called anymore
		socket.player.alive = false;
		log.all(socket.player.name + " has been killed");
	}
	getNearPlayers(player, avoidSelf) {
		// Get all the players close to "player"
		var x = player.player.x;
		var y = player.player.y;
		// Create a square to search for players within it
		var x1 = x - this.gameServer.config.updateRadius.x;
		var x2 = x + this.gameServer.config.updateRadius.x;
		var y1 = y - this.gameServer.config.updateRadius.y;
		var y2 = y + this.gameServer.config.updateRadius.y;

		var players = this.gameServer.manager.realPlayers;
		var near = [];
		let allNear = [];
		for (var i = 0; i < players.length; ++i) {
			var px = players[i].player.x;
			var py = players[i].player.y;
			if (x1 <= px && px <= x2 && (y1 <= py && py <= y2)) {
				// The player is within the square
				if (players[i].player.alive) {
					near.push(players[i]);
					if (
						player.player.seen[players[i].player.id] !==
						players[i].player.life &&
						players[i] != player
					) {
						// Emit player add to the socket
						this.addPlayer(player, players[i]);
						player.player.seen[players[i].player.id] = players[i].player.life;
					}
				}
				allNear.push(players[i]);
			}
		}
		if (!avoidSelf) player.player.playersNear = near;
		player.player.allNear = allNear;
		return near;
	}
	hitObject(socket, object) {
		log.all(socket.player.name + " has hit a " + object.constructor.name);
		var near = socket.player.allNear;
		object.hit && object.hit(socket);
		// Emit object wiggle to surrounding players
		for (var i = 0; i < near.length; ++i) {
			var n = near[i];
			n.send(SERVER.WIGGLE, socket.player.angle, object.sid);
		}
		// Update player stats
		if (!object.dontGather)
			socket.player.gather(object, this.gameServer.config.gatherMultiplier);
		// Send the player their new stats
		this.updateMaterials(socket);
	}
	updatePlacedItems(socket, index, amt){
		socket.send(SERVER.UPDATE_ITEM_COUNT, index, amt)
	}
	hitPlayer(p1, p2) {
		// Only take damage if players are on different teams
		if (!p1.player.clan || !p2.player.clan || !(p1.player.clan.name === p2.player.clan.name)) {
			log.all(p1.player.name + " has hit " + p2.player.name);
			p2.player.hitFrom(p1);
		}
	}
	getBySID(sid) {
		if (this.players[sid - 1]) return this.players[sid - 1];
		return null;
	}
	close(socket, reason) {
		socket.send(SERVER.DISCONNECT, reason);
		this.removeIndex.call(this, socket.player.sid - 1);
		log.info('Closing socket for "' + reason + '"');
		socket.dc(reason);
	}
	broadcast(message){
		this.gameServer.io.send(SERVER.ANNOUNCE, message)
	}
	add(socket) {
		socket.player = new Player(socket, this.players.indexOf(void 0) + 1, this.gameServer);
		this.players[this.players.indexOf(void 0)] = socket;
		this.realPlayers = this.players.filter(e => e);
	}
	remove(socket) {
		this.players.includes(socket) && (socket.player.killLeader && ((socket.player.kills = 0), this.updateKillLeader(0, null, !0)), this.removeIndex(this.players.indexOf(socket)));
	}
	removeObjFromPlayers(object) {
		let players = object.seenPlayers;
		let msg = null;
		for (const key in players) {
			if (players.hasOwnProperty(key)) {
				const player = players[key].socket;
				delete player.player.seenObjs[object.sid]
				!msg &&
					(msg = player.encode(SERVER.BUILDING_DESTROYED, object.sid));
				try {
					if (player.getBufferedAmount() < 1024) player._send(msg, !0);
					else player.msgQueue.push(msg);
				} catch (e) { }
			}
		}
	}
	updateKillLeader(amount, doer, overide) {
		if (!overide || (amount <= this.topKills && this.killLeader && this.killLeader.player && this.killLeader.player.alive)) return;
		let players = this.realPlayers.slice().filter(e => e.player.alive && e.player.kills > amount);
		if (players.length == 0)
			return (this.killLeader && (this.killLeader.player.killLeader = 0), (this.topKills = amount), (this.killLeader = doer),(doer.player.killLeader = 1));
		players = players.sort((a, b) => {
			return b.player.kills - a.player.kills;
		});
		[players[0].player.killLeader, this.topKills, this.killLeader] = [1, players[0].player.kills, players[0]];
	}
	constructor(gameServer) {
		this.gameServer = gameServer;
		this.players = new Array(gameServer.config.maxPlayers);
		this.players.fill(void 0);
		this.realPlayers = [];
		this.topKills = 0;
		this.killLeader = null;
	}
}
module.exports = PlayerManager;
