var Utils = require("./Utils");

class PhysicsEngine {
	needsToMove(p) {
		return p.player.xVel || p.player.yVel || p.player.moveDir !== null || p.player.updateFrames;
	}
	placeTest(scale, x, y, objs = []) {
		let hypot = Math.hypot;
		for (var j = objs.length; j--;) {
			var obj = objs[j];
			if (hypot(obj.x - x, obj.y - y) < scale + obj.realScale) return !1;
		}
		return !0;
	}
	objectCollision(p, mx, my) {
		/*
				TODO: Only check collision of
				objects around the player
			*/
		let cos = Math.cos;
		let atan2 = Math.atan2;
		let hypot = Math.hypot;
		let sin = Math.sin;
		var me = this;
		var objs = p.player.itemCache || [];
		var inBox = false;
		for (var j = objs.length; j--;) {
			var obj = objs[j];
			var s = obj.realScale + 35;
			let a = hypot(obj.x - mx, obj.y - my) - s;
			if (a <= 0) {
				let dir = atan2(my - obj.y, mx - obj.x);
				mx = obj.x + s * cos(dir);
				my = obj.y + s * sin(dir);
				p.player.xVel *= .83;
				p.player.yVel *= .83;
				if (obj.dmg && !(obj.owner && obj.owner.team !== p.player.team)) {
					p.player.xVel += cos(dir);
					p.player.yVel += sin(dir);
					p.player.updateHealth(-obj.dmg, obj.owner ? obj.owner : null);
				}
			}
		}
		return [mx, my];
	}
	inEntity(p, entity, s) {
		var x1 = p.x;
		var y1 = p.y;

		var x2 = entity.x;
		var y2 = entity.y;
		var hitBox = [
			[x2 - s, y2 - s],
			[x2 - s, y2 + s],
			[x2 + s, y2 + s],
			[x2 + s, y2 - s]
		];
		return Utils.inPolygon([x1, y1], hitBox);
	}
	playerCollision(p, mx, my) {
		// Method is called within the context of the GameServer
		/*
				TODO: Only check collision of
				players around the player
			*/
		let cos = Math.cos;
		let atan2 = Math.atan2;
		let hypot = Math.hypot;
		let sin = Math.sin;
		var realPlayers = p.player.playersNear;
		for (var j = realPlayers.length; j--;) {
			var p2 = realPlayers[j];
			if (p == p2 || !p2.player.alive || !p2.player.spawned) continue;
			let a = hypot(p2.player.x - mx, p2.player.y - my) - 70;
			if (a <= 0) {
				p2.player.updateFrames = 5;
				let dir = atan2(my - p2.player.y, mx - p2.player.x);
				a = -1 * a / 2;
				mx += a * cos(dir);
				my += a * sin(dir);
				p2.player.x -= a * cos(dir);
				p2.player.y -= a * sin(dir);
			}
		}
		return [mx, my];
	}
	checkPlace(obj, x, y) {
		if (y < this.gameServer.mapSize / 2 - 724 / 2 || (obj.allowedInWater && obj.allowedInDesert)) return !0;
		if (!obj.allowedInWater && y <= this.gameServer.mapSize / 2 + 724 / 2) return !1;
		if (!obj.allowedInDesert && y >= this.gameServer.mapSize - 2400) return !1;
		return !0;
	}
	getAttackLocation(p) {
		var me = this;
		var a = p.player.angle;
		var x = p.player.x;
		var y = p.player.y;
		var d = p.player.weapon.range;
		var x2 = d * Math.cos(a) + x;
		var y2 = d * Math.sin(a) + y;
		return [x2, y2];
	}
	movePlayer(p) {
		var me = this;
		var mx = p.player.x;
		var my = p.player.y;
		/*if (Utils.isInSnow(p)) {
				speed = me.config.snowSpeed;
			}*/
		let xMov = p.player.moveDir !== null ? Math.cos(p.player.moveDir) : 0;
		let yMov = p.player.moveDir !== null ? Math.sin(p.player.moveDir) : 0;
		let hypot = Math.hypot(xMov, yMov);
		if (hypot != 0) {
			xMov /= hypot;
			yMov /= hypot;
		}

		//33 is time since last tick
		let multi = (p.player.buildCode >= 0 ? 0.5 : 1) * ((p.player.tail && p.player.tail.spdMult) || 1) * ((p.player.hat && p.player.hat.spdMult) || 1) * (p.player.weapon.spdMult || 1);
		if (my > 6850 && my < 7550) p.player.hat && p.player.hat.watrImm ? (multi *= 0.75, p.player.xVel += 0.4 * 33 * 0.0011) : (multi *= .33, p.player.xVel += 0.0011 * 33);
		xMov && (p.player.xVel += xMov * 0.0016 * multi * 33);
		yMov && (p.player.yVel += yMov * 0.0016 * multi * 33);
		let val = 1 / Math.min(4, Math.max(1, Math.round(Math.cos((p.player.xVel * 33) ** 2 + (p.player.yVel * 33) ** 2) / 40)));
		p.player.xVel && ((mx += p.player.spdMult * p.player.xVel * 33 * val * 1.5), (p.player.xVel *= 0.993 ** 33), p.player.xVel <= 0.01 && p.player.xVel >= -0.01 && (p.player.xVel = 0));
		p.player.yVel && ((my += p.player.spdMult * p.player.yVel * 33 * val * 1.5), (p.player.yVel *= 0.993 ** 33), p.player.yVel <= 0.01 && p.player.yVel >= -0.01 && (p.player.yVel = 0));
		return [mx, my];
	}
	borderCollision(mx, my) {
		var me = this;
		mx + 35 >= me.config.mapSize && (mx = me.config.mapSize - 35) || mx - 35 <= 0 && (mx = 35);
		my + 35 >= me.config.mapSize && (my = me.config.mapSize - 35) || my - 35 <= 0 && (my = 35);
		return [mx, my];
	}
	constructor(serv) {
		this.serv = this.gameServer = serv;
	}
}

module.exports = PhysicsEngine;
