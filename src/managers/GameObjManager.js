var Tree = require('../entities/Tree');
var Stone = require('../entities/Stone');
var Bush = require('../entities/Bush');
var Gold = require('../entities/Gold');
var GameObj = require('../entities/GameObject');
var PlayerObj = require('../entities/PlayerObject');
var Utils = require('../utils/Utils');

class GameManager {
	getObjsNear(socket, radius, shouldBypass) {
		var me = this;
		var px = socket.player.x;
		var py = socket.player.y;
		var x1 = px - radius.x;
		var x2 = px + radius.x;
		var y1 = py - radius.y;
		var y2 = py + radius.y;
		var near = [];
		for (var i = 0; i < this.realObjs.length; ++i) {
			if (socket.player.seenObjs[this.realObjs[i].sid] && !shouldBypass) continue;
			var x = this.realObjs[i].x;
			var y = this.realObjs[i].y;
			if ((x1 <= x && x <= x2) && (y1 <= y && y <= y2)) {
				near.push(this.realObjs[i]);
				socket.player.seenObjs[this.realObjs[i].sid] = this.realObjs[i];
				this.realObjs[i].seenPlayers[socket.player.id] = socket.player;
			}
		}
		!shouldBypass && (socket.player.objsNear = near);
		return near;
	}
	//setNewObject
	getSpawnableObj() {
		return this.spawnableObjs[
			Utils.rand(this.spawnableObjs.length)
		];
	}
	getRandCoord() {
		var me = this;
		return Utils.rand(me.gameServer.config.mapSize);
	}
	generateObjects(amount, distance = 200) {
		// Create random objects
		this.objLen = amount;
		for (var i = 0; i < amount; ++i) {
			// For now just generate trees
			var RandomObject = this.getSpawnableObj();
			let myObj = new RandomObject(i);
			this.objs.push(myObj);

			let x = this.getRandCoord();
			let y = this.getRandCoord();
			let badPlace = !0;
			while (Math.min(...this.objs.map(o => Utils.getDist(o.x, o.y, x, y))) < distance || badPlace) {
				if (myObj.wood == 1) {
					x = this.getRandCoord();
					y = this.getRandCoord() - 2500;
					for (var k = 0; k < 100; k++) if (y - 2500 < 0) {
						y = this.getRandCoord() - 2500;
					}
				} else {
					x = this.getRandCoord();
					y = this.getRandCoord();
				}
				for (var k = 0; k < 100; k++) if (y > 6850 && y < 7550 && !myObj.stone) {
					y = this.getRandCoord();
				} //just retries if the object is in the river. did ten iterations so that stuff will almost never spawn in river. and by never, it's like ~ (2000/14400)^10
				badPlace = !(this.gameServer.phys.checkPlace(myObj, x, y));
			}
			this.objs[i].setCords(x, y);
		}
		this.objs.push(new PlayerObj(amount + 1, { player: { sid: 1, gameServer: { objs: this }, itemCache: [] } }, 1000, 1000, 0));
		let a = new Gold(amount + 2);
		a.x = a.y = this.gameServer.config.mapSize / 2;

		//fix this dev
		for (var k = 0; k < 10; k++) {
			let a = new Gold(amount + 2 + k + 1);
			var tmp = Math.floor(Math.random() * 4);
			if (tmp == 0) {
				a.x = this.gameServer.config.mapSize / 2 + Math.floor(Math.random() * 1000);
				a.y = this.gameServer.config.mapSize / 2 + Math.floor(Math.random() * 1000);
			} else if (tmp == 1) {
				a.x = this.gameServer.config.mapSize / 2 - Math.floor(Math.random() * 1000);
				a.y = this.gameServer.config.mapSize / 2 - Math.floor(Math.random() * 1000);
			} else if (tmp == 2) {
				a.x = this.gameServer.config.mapSize / 2 - Math.floor(Math.random() * 1000);
				a.y = this.gameServer.config.mapSize / 2 + Math.floor(Math.random() * 1000);
			} else if (tmp == 3) {
				a.x = this.gameServer.config.mapSize / 2 + Math.floor(Math.random() * 1000);
				a.y = this.gameServer.config.mapSize / 2 - Math.floor(Math.random() * 1000);
			}; //gold center
			this.objs.push(a);
		}

		this.objs.push(a);
		this.realObjs = this.objs;
		this.objLen = amount + 12;
	}
	removeObject(sid) {
		if (!this.objs[sid]) return;
		let obj = this.objs[sid];
		this.gameServer.manager.removeObjFromPlayers(this.objs[sid]);
		this.objs[sid] = void 0;
		this.realObjs = this.objs.filter(e => e);

	}
	addObject(constr, owner, x, y, dir) {
		if (this.objs.indexOf(void 0) >= 0) {
			let ob = new constr(this.objs.indexOf(void 0), owner, x, y, dir);
			this.objs[this.objs.indexOf(void 0)] = ob;
			this.realObjs = this.objs.filter(e => e)
		} else {
			let ob = new constr(this.objs.length, owner, x, y, dir);
			this.objs.push(ob);
			this.realObjs = this.objs.filter(e => e)
		}
	}
	constructor(gameServer) {
		this.gameServer = gameServer;
		this.objs = [];
		this.realObjs = [];
		this.objLen = 0;
		this.spawnableObjs = [
			Tree,
			Stone,
			Bush
		];
	}
}
module.exports = GameManager;
