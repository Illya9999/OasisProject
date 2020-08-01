var log = require("../utils/Logger");
const { SERVER } = require("../utils/packetCodes");
const CommandHandler = require('./CommandHandler');

var Items1 = require("./Items");

class MessageHandler {
	checkConnection(socket) {
		var me = this;
		if (!socket || !socket.player) return false;
		if (!socket.player.connected) {
			me.manager.close(socket, "Connection handshake not completed.");
		}
		return socket.player.connected;
	}
	conn(socket) {
		var me = this;
		if (socket.player.connected) {
			// For some reason the client sent a connection packet while already connected
			this.manager.close(socket, "Invalid connection");
		} else if (this.manager.realPlayers.length >= this.config.maxPlayers) {
			// Server is full
			me.manager.close(socket, `The Oasis is currently full.`);
		} else {
			// The client is now connected
			socket.player.connected = true;
		}
	}
	disconn(socket) {
		log.all("Player disconnected,", socket.player.name);
		socket.player.team && this.msgHandler.clanLeave(socket);
		this.io.send(SERVER.PLAYER_REMOVE, socket.player.id);
		this.manager.remove(socket);
	}
	angle(socket, ang) {
		// Player angle update
		ang && typeof ang == 'number' && !isNaN(ang) && (socket.player.angle = ang);
	}
	move(socket, direction) {
		if (socket.player.connected && typeof direction === "number") {
			socket.player.moveDir = direction;
		} else if (direction == null) {
			socket.player.moveDir = null;
		} else this.manager.close(socket, "Kicked for hacks");
	}
	autoAttack(socket, isDirLock) {
		log.all(`Player ${socket.player.name} has toggled ${isDirLock ? 'rotation lock' : 'auto attack'}`);
		socket.player[isDirLock ? "dirLock" : "autoAtk"] = !socket.player[isDirLock ? "dirLock" : "autoAtk"];
	}
	chat(socket, msg) {
		let me = this;
		if (typeof msg !== "string") return;
		msg = msg.trim();
		if (msg.startsWith('/') && socket.admin) return this.msgHandler.handleCmd.call(this, socket, msg);
		let near = socket.player.allNear;
		for (var i = near.length; i--;) {
			this.manager.sendChat(socket, near[i], msg);
		}

	}
	handleCmd(socket, msg) {
		const args = msg.substring(1).split(/\s+/g),
		cmd = args.shift().toLowerCase();
		console.log(cmd, args);
		if(!CommandHandler.has(cmd)) return;
		CommandHandler.get(cmd).call(this.manager, socket.player, ...args);
	}
	syncClanPlayers(socket, data) {
		socket.send(SERVER.SET_CLAN_PLAYERS, data);
	}
	deleteClan(clan, owner) {
		try {
			owner.player.joinQueue = clan.joinQueue;
		} catch (e) { }
		let members = clan.members.slice();
		for (var i = members.length; i--;) {
			clan.removePlayer(members[i]);
			members[i].send(SERVER.PLAYER_SET_CLAN, null, 0);
		}
		this.clans.remove(clan.name);
		this.io.send(SERVER.CLAN_DEL, clan.name);
	}
	attemptBuy(socket, isBuying, id, isTail = !1) {
		var item = this.store.getItemById(id, isTail);
		if (isBuying && id) {
			log.all(socket.player.name + " attempted to buy item " + item.name);
			if (this.store.canBuyItem(socket, item)) {
				socket.player.addItem(item, isTail);
				global.gameServer.sandbox || (socket.player.points -= item.price);
				this.manager.updateStore(socket, 0, item.id, isTail);
				socket.player.updateMaterial("points");
				log.all(socket.player.name + " has purchased item " + item.name);
			} else {
				log.all(socket.player.name + " can't purchase item " + item.name);
			}
		} else if (id || id === 0) {
			if (socket.player.hasItem(id, isTail) || (item && (item.price === 0 || (item.forStaff && (socket.mod || socket.admin || socket.vip))))) {
				log.all(socket.player.name + " is equipting hat " + id);
				socket.player.equiptItem(item, isTail);
				this.manager.updateStore(socket, 1, item.id, isTail);
			} else if (id === 0) {
				socket.player.unequipt(isTail);
				this.manager.updateStore(socket, 1, 0, isTail);
			} else {
				this.manager.close(socket, "Kicked for hacks");
			}
		} else {
			this.manager.close(socket, "Kicked for hacks");
		}
	}
	notificationResponse(socket, sid, join) {
		var p = this.manager.getBySID(sid);

		if (!socket.player.clan || socket.player.joinQueue) {
			if (!socket.player.joinQueue[0])
				return this.manager.close(socket, "Kicked for hacks");
			if (socket.player.joinQueue[0][0] !== sid)
				return this.manager.close(socket, "Kicked for hacks");
			socket.player.joinQueue.shift();
		} else {
			if (socket.player.clan.joinQueue[0][0] !== sid)
				return this.manager.close(socket, "Kicked for hacks3");
			let queue = socket.player.clan.joinQueue.shift();
			if (!p || queue[1] !== p.player.id) return;
			if (join && !p.player.clan) {
				// Player can join the clan
				log.all(p.player.name + " has joined clan " + socket.player.clan.name);
				socket.player.clan.addPlayer(p);
				p.send(SERVER.PLAYER_SET_CLAN, socket.player.team, 0);
				let data = socket.player.clan.serializeMembers();
				for (let i = socket.player.clan.members.length; i--;)
					this.msgHandler.syncClanPlayers(socket.player.clan.members[i], data);
			}
		}
	}
	doUpgrade(socket, id) {
		log.all(socket.player.name + " tried to upgrade with id " + id);
		var age = socket.player.upgrAge;
		var pts = socket.player.upgradePoints;
		let list = Items1.weapons;
		let isWeapon = !0;
		if (id > 15) (list = Items1.list), (id -= 16), (isWeapon = !1);
		if (pts < 1 || !list.hasOwnProperty(id) || list[id].age !== age)
			return this.manager.close(socket, "Kicked for hacks");
		let item = list[id];
		if (item.pre && socket.player[isWeapon ? "weapons" : "items"].indexOf(item.pre) === -1)
			return this.manager.close(socket, "Kicked for hacks");
		if (isWeapon) {
			socket.player.weaponCode == socket.player.weapons[item.type] && ((socket.player.weapon = item), (socket.player.weaponCode = item.id));
			socket.player.weapons[item.type] = id;
			socket.player.weaponExp[item.type] = 0;
			socket.player.earnWeaponExp(0);
		} else {
			socket.player.buildCode === socket.player.items[item.group.id] && (socket.player.buildCode = item.id);
			socket.player.items[item.group.id] = item.id;
			socket.player.items = socket.player.items.filter(item => item !== void 0);
		}
		socket.player.upgradePoints--;
		socket.player.upgrAge++;
		this.manager.syncPlayerItems(socket);
		this.manager.sendUpgrades(socket, socket.player.upgradePoints, socket.player.upgrAge);
	}
	attack(socket, atk, buildDir) {
		var me = this;
		if (socket.player.alive) {
			if (socket.player.buildCode === -1) {
				socket.player.attacking = !!atk; // Regular attack
			} else {
				// Player is attempting to build something
				socket.player.useCurrentItem(buildDir || socket.player.angle);
			}
		}
	}
	clanKick(socket, sid) {
		if (!socket.player.clan || socket.player.clan.ownerID !== socket.player.sid)
			return this.manager.close(socket, "Kicked for hacks");
		var p = this.manager.getBySID(sid);
		if (!p) return this.manager.close(socket, "Kicked for hacks");
		socket.player.clan.removePlayer(p);
		p.send(SERVER.PLAYER_SET_CLAN, null, 0);
		let data = socket.player.clan.serializeMembers();
		for (let i = socket.player.clan.members.length; i--;)
			this.msgHandler.syncClanPlayers(socket.player.clan.members[i], data);
	}
	clanJoin(socket, sid) {
		if (socket.player.team)
			return this.manager.close(socket, "Kicked for hacks");
		var clan = this.clans.getByName(sid);
		let isreq = !1;
		for (let i = 0; i < clan.joinQueue.length; i++)
			clan.joinQueue[i][1] === socket.player.id && ((i = 9000000), (isreq = !0));
		if (clan && !isreq) {
			clan.joinQueue.push([socket.player.sid, socket.player.id]);
			clan.owner.send(SERVER.JOIN_REQ, socket.player.sid, socket.player.name);
		}
	}
	clanLeave(socket) {
		//mfw we call this method from 2 diffrent scopes
		if (!socket.player.team)
			return (this.manager || this).close(socket, "Kicked for hacks");
		log.all('Player "' + socket.player.name + '" is leaving their clan ' + socket.player.team);
		try {
			if (socket.player.isTribeOwner)
				return ((socket.player.isTribeOwner = 0), this.msgHandler.deleteClan.call(this, socket.player.clan, socket));
		} catch (e) {
			if (socket.player.isTribeOwner)
				return ((socket.player.isTribeOwner = 0), this.deleteClan.call(this, socket.player.clan, socket));
		}
		let clan = socket.player.clan;
		if (!clan) return;
		clan && clan.removePlayer(socket);
		socket.send(SERVER.PLAYER_SET_CLAN, null, 0);
		let data = clan.serializeMembers();
		try {
			for (let i = clan.members.length; i--;)
				this.msgHandler.syncClanPlayers(clan.members[i], data);
		} catch (e) {
			for (let i = clan.members.length; i--;)
				this.syncClanPlayers(clan.members[i], data);
		}
	}
	clanCreate(socket, clanName) {
		if (typeof clanName !== "string")
			return this.manager.close(socket, "Kicked for hacks");
		if (clanName.trim() == "") return;
		if (!this.clans.clanExists(clanName)) {
			// It's safe to add the clan
			this.clans.add(clanName);
			this.clans.newestClan.addPlayer(socket);
			var newClanData = this.clans.newestClan.serialize();
			// Broadcast the creation of a new clan
			this.io.send(SERVER.CLAN_ADD, newClanData);
			// Set the player's clan to the new clan
			socket.send(SERVER.PLAYER_SET_CLAN, newClanData.sid, 1);
			this.msgHandler.syncClanPlayers(socket, socket.player.clan.serializeMembers());
			log.all("Clan '" + clanName + "' has been created by " + socket.player.name);
		}
	}
	spawn(socket, data) {
		var me = this;
		if (!this.msgHandler.checkConnection.call(me, socket))
			return log.all("super error");
		// Player can spawn, update their name
		let close = this.close || this.manager.close;
		if (data.name == void 0 || typeof data.name !== "string" || data.skin == void 0 || typeof data.skin !== "number" || isNaN(data.skin) || data.skin < 0 || data.skin > 9)
			return close.call(this.manager || this, socket, "Kicked for hacks");
		var name = data.name.trim().replace(/\s+/g, " ").substring(0, 30);
		if (name === "") name = this.config.unknownName;

		socket.player.name = name;
		socket.player.skinColor = data.skin;

		// no item cache at this time
		var x, y, scale, obj, i;

		generatePosition:
		while (true) {
			x = (Math.random() * this.config.mapSize) | 0;
			y = (Math.random() * this.config.mapSize) | 0;

			for (i = 0; i < global.gameServer.objs.realObjs.length; i++) {
				obj = global.gameServer.objs.realObjs[i];
				scale = obj.realScale + 35;

				if (Math.hypot(obj.x - x, obj.y - y) - scale < 0)
					continue generatePosition;
			}

			socket.player.x = x;
			socket.player.y = y;
			break;
		}

		if (!socket.player.spawned) {
			// New players get an empty update packet
			socket.player.spawned = true;
			me.manager.sendStart(socket, 100);
			me.manager.sendStart(socket);
			socket.send(SERVER.PLAYER_ADD, socket.player.getData(), true);
		} else {
			// Player is respawning
			socket.player.resetPlayer(me.config.saveStats);
			me.manager.addSelfPlayer(socket);
		}
		setTimeout(() => {
			log.all("Spawned player with name " + name);
			socket.player.alive = true;
			me.manager.updateHealth(socket, 0);
			//me.manager.addSelfPlayer(socket);
			socket.send(SERVER.UPDATE_HEALTH, socket.player.sid, socket.player.health);

			// Send player data to player

			me.manager.updateMaterials(socket);
		}, 10);
	}
	select(socket, index, isWeapon) {
		var me = this;
		log.all(socket.player.name + " has selected item " + index);
		if (isWeapon) {
			if (socket.player.weapons.includes(index)) {
				socket.player.buildCode = -1;
				socket.player.weaponCode = index;
				socket.player.setWeapon(Items1.weapons[index]);
			} else {
				return me.manager.close(socket, "Kicked for hacks");
			}
		} else {
			if (index === socket.player.buildCode) {
				socket.player.buildCode = -1;
			} else if (socket.player.items.includes(index)) {
				var item = Items1.list[index];
				if (item) {
					log.all(socket.player.buildCode)
					socket.player.buildCode = item.id;
					socket.player.attacking = !1;

					/*if (socket.player.canBuild(item)) {
								  item.build(socket);
							  }*/
				} else {
					return me.manager.close(socket, "Kicked for hacks");
				}
			}
		}
		me.manager.updateMaterials(socket);
	}
	constructor(gameServer) {
		this.gameServer = gameServer;
	}
}
module.exports = MessageHandler;
