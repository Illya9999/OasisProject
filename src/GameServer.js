//Imports
var MessageHandler = require('./managers/MessageHandler');
var log = require('./utils/Logger');
var Manager = require('./managers/PlayerManager');
var Leaderboard = require('./entities/Leaderboard');
var ClanManager = require('./managers/ClanManager');
var Minimap = require("./managers/MinimapManager");
var GameObjManager = require('./managers/GameObjManager');
var PhysicsEngine = require('./utils/PhysicsEngine');
var Store = require('./managers/Store');
var attachHandlers = require('./attachHandlers');
var io = require('./utils/Socket');

class GameServer {
	start() {
		var me = this;
		me.io = new io(this.config.port, this);
		log.info('Started GameServer on port ' + me.config.port);
		me.io.on('connection', socket => {
			attachHandlers.call(me, me, socket);
		});
	}
	//MOVE THIS TO THE PLAYER TICK FUNCTION
	attackTick() {
		var me = this;
		if (me.alive) {
			var realPlayers = me.manager.realPlayers;
			let hypot = Math.hypot;
			let atan2 = Math.atan2;
			let abs = Math.abs;
			let PI = Math.PI;
			let hPI = Math.PI / 2.6;
			for (var i = realPlayers.length; i--;) {
				var p = realPlayers[i];
				if (p.player.alive) {
					if (p.player.attackingState) {
						p.player.reloads[p.player.weapon.type] = p.player.weapon.speed;
						p.player.lastMove = Date.now();
						this.invis = !1;
						if (!p.player.weapon.gather) continue;
						var al = me.phys.getAttackLocation(p);

						var objn = p.player.itemCache || [];
						let r = p.player.weapon.range;
						for (var j = objn.length; j--;) {
							var o = objn[j];
							if (o.scale + r < hypot(o.x - p.player.x, o.y - p.player.y)) continue;
							let ang = atan2(o.y - p.player.y, o.x - p.player.x);
							let angDist = abs(p.player.angle - ang) % (2 * PI);

							angDist > PI && (angDist = 2 * PI - angDist);
							if (!(angDist <= hPI)) continue;
							me.manager.hitObject(p, o);
						}
						var near = p.player.allNear;
						for (var j = near.length; j--;) {
							// Alert nearby players of the attack start
							me.manager.sendAttack(near[j], p, p.player.hitObj);
							if (!near[j].player.alive) continue;
							// Handle player attacking
							var playerHit = me.phys.inEntity({
								x: al[0],
								y: al[1]
							}, {
								x: near[j].player.x,
								y: near[j].player.y
							}, near[j].player.scale * 2);
							if (playerHit && p != near[j]) {
								me.manager.hitPlayer(p, near[j]);
							}

						}
						p.player.reloads[p.player.weapon.type] = p.player.weapon.speed * (p.player.hat && p.player.hat.atkSpd || 1);
					} else if (p.player.buildCode === -1 && p.player.reloads[p.player.weapon.type] | 0 !== 0) {
						p.player.reloads[p.player.weapon.type] -= 66;
						p.player.reloads[p.player.weapon.type] < 0 && (p.player.reloads[p.player.weapon.type] = 0);
					}
				}
			}
		}
	}
	constructor(config = {}) {
		// a lot of these options DONT WORK
		config = Object.assign({
			unknownName: 'unknown',
			tickInterval: 1000 / 30,
			port: 3000,
			mapSize: 14400,
			snowStart: 2400,
			updateRadius: {
				x: 1248,
				y: 702
			},
			playerSpeed: 60,
			snowSpeed: 60 * 0.75,
			statUpdateSpeed: 2000,
			leaderboardCount: 10,
			maxPlayers: 76,
			gameObjects: 300,
			gameObjectDistance: 400,
			gatherMultiplier: 1,
			debugMode: !1,
			debugRecieved: process.env.debugRecieved || 'DEBUG',
			debugReply: process.env.debugReply || 'DEBUG',
			saveStats: !1,
			sandbox: !1,
			adminEnabled: !1,
			adminQuery: process.env.adminQuery || 'pw',
			adminPass: process.env.adminPass || 'admin'
		}, config);
		var me = this;
		this.config = config;
		this.sandbox = config.sandbox;
		this.atkInterval = config.tickInterval * 2;
		this.io = null; // The websocket server
		this.currentTick = 0;
		this.alive = true;
		this.msgHandler = new MessageHandler(me);
		this.manager = new Manager(me);
		this.leaderboard = new Leaderboard(me, 'points');
		this.clans = new ClanManager(me);
		this.minimap = new Minimap(me);
		this.objs = new GameObjManager(me);
		this.phys = new PhysicsEngine(me);
		this.store = new Store(me);
		this.objs.generateObjects(config.gameObjects, config.gameObjectDistance);

		me.attackClock = setInterval(() => {
			me.attackTick.call(me);
		}, me.atkInterval);
		global.gameServer = me;
	}
}

module.exports = GameServer;
