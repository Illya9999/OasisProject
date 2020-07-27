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
	generateObjects(amount, distance = 401) {
		let mapScale = this.gameServer.config.mapSize;
		// Create random objects
		this.objLen = amount;
		this.objs.push(new PlayerObj(amount + 1, { player: { sid: 1, gameServer: { objs: this }, itemCache: [] } }, 1000, 1000, 0));
		for (var i = 0; i < amount; i++) {
			var RandomObject = this.getSpawnableObj();
			let x;
			let y;
			let myObj = new RandomObject(i);
			let overlap = false;
			 switch (myObj.type) {
				case 0:
				 x = this.getRandCoord();
				 y = Utils.randChoice([Utils.randBetween(0, 6850), Utils.randBetween(7550, mapScale-2400)]);
				if(this.objs.length)
				{
				overlap = this.objs.some(o=>Utils.getDist(x, y, o.x,o.y)<distance);
				}
				if(overlap){
				i--
				break;
				};
				myObj.setCords(x, y);
				this.objs.push(myObj);
				break;
				case 1:
				x = this.getRandCoord();
				y = Utils.randChoice([Utils.randBetween(0, 6850), Utils.randBetween(7550, mapScale)]);
				if(this.objs.length)
				   {
				   overlap = this.objs.some(o=>Utils.getDist(x, y, o.x,o.y)<distance);
				   }
				   if(overlap){
					i--
					break;
					};
				   myObj.setCords(x, y);
				   this.objs.push(myObj);	
				break;
				case 2:
				 x = this.getRandCoord();
				 y = this.getRandCoord();
				if(this.objs.length)
				{
				overlap = this.objs.some(o=>Utils.getDist(x, y, o.x,o.y)<distance);
				}
				if(overlap){
					i--
					break;
					};
				myObj.setCords(x, y);
				this.objs.push(myObj);
				break;
			};
	}
	//Gold Center
	let GoldOverlap = false;
	for(var k = 0; k < 10; k++){
	let a = new Gold(amount + 2 + k + 1);
	a.x = this.getRandCoord();
	a.y = Utils.randBetween(6850, 7550);
	GoldOverlap = this.objs.some(o=>Utils.getDist(a.x, a.y, o.x,o.y)<distance);
	if(GoldOverlap){
	k--
	break;
};
	this.objs.push(a);	
	}
	this.realObjs = this.objs;
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
