var Items = require('../managers/Items');
const { SERVER } = require('../utils/packetCodes');
const Utils = require('../utils/Utils');
const weaponVariants = [{
	id: 0,
	src: "",
	xp: 0,
	val: 1
}, {
	id: 1,
	src: "_g",
	xp: 3e3,
	val: 1.1
}, {
	id: 2,
	src: "_d",
	xp: 7e3,
	val: 1.18
}, {
	id: 3,
	src: "_r",
	poison: !0,
	xp: 12e3,
	val: 1.18
}];
var i = 0;
class Player {
	static getId() {
		// Example ID: _nHpPQT_l0zYRzjUAABL
		var res = "";
		for (var i = 0; i < Player.ID_LEN; ++i)
			res += Player.ID_CHARS[Math.random() * Player.ID_CHARS_LEN | 0];
		return res;
	}
	updateItemCache() {
		if (!this.alive) return;
		//only get objects within 400 so that we send less data
		this.itemCache = this.gameServer.objs.getObjsNear(this.socket, { x: 400, y: 400 }, !0);
	}
	tick() {
		let near = this.gameServer.manager.getNearPlayers(this.socket);
		if (this.alive) {
			this.placedInOneFrame = 0;
			let objsNear = this.gameServer.objs.getObjsNear(this.socket, this.gameServer.config.updateRadius);
			let phys = this.gameServer.phys;

			if (phys.needsToMove(this.socket)) {
				// Handle player movement
				this.updateFrames && this.updateFrames--;
				this.lastMove = Date.now();
				this.invis = !1;
				let [mx, my] = phys.movePlayer.call(this.gameServer, this.socket);
				// Handle player playerCollisionon
				[mx, my] = phys.playerCollision.call(this.gameServer, this.socket, mx, my);
				// Handle game object collision
				[mx, my] = phys.objectCollision.call(this.gameServer, this.socket, mx, my);
				[this.x, this.y] = phys.borderCollision.call(this.gameServer, mx, my);
			} else if (!this.invis && this.hat && this.hat.invisTimer && Date.now() - this.lastMove > this.hat.invisTimer) this.invis = !0;
			//console.log(this.socket.player.x);
			let sdata = Utils.serializePlayerArray(near, this);
			this.gameServer.manager.sendRawUpdate(this.socket, sdata);

			// Update game objects
			if (objsNear.length > 0) {
				let oData = [];
				for (let j = objsNear.length; j--;) oData = oData.concat(objsNear[j].serialize());
				this.gameServer.manager.sendObj(this.socket, oData);
				this.objsNear = objsNear;
			}
		} else if (this.spawned) {
			let sdata = Utils.serializePlayerArray(near, this);
			this.gameServer.manager.sendRawUpdate(this.socket, sdata);

			// Update game objects
			//this.gameServer.manager.sendObj(this.socket, this.objCache);
		}
	}
	getData() {
		return [
			this.id,
			this.sid,
			//this gives a visual display of their sid for testing reasons
			'{' + this.sid + '} ' + this.name,
			this.x,
			this.y,
			this.angle,
			this.health,
			this.maxHealth,
			this.scale,
			this.skinColor
		];
	}
	getUpdateData() {
		this.dataCache = [
			this.sid,
			this.x,
			this.y,
			this.angle,
			this.buildCode,
			this.weaponCode,
			this.weaponType,
			this.team,
			this.isTribeOwner,
			this.skinCode,
			this.tailCode,
			this.killLeader,
			0 // zindex, it will only be 1 if they are on a platform
		]
		return this.dataCache;
	}
	get attackingState() {
		return (this.autoAtk || this.attacking) && this.buildCode === -1 && (this.reloads[this.weapon.type] <= 0);
	}
	get canUpgrade() {
		return (this.upgradePoints >= 0);
	}
	gather(object, multiplier) {
		if (object.noGather && !object.dead) return;
		var me = this;
		var rate = me.weapon.gather || 0;
		object.wood && (this.xp += object.wood * rate * 4, this.addRes('wood', object.wood * rate));
		object.stone && (this.xp += object.stone * rate * 4, this.addRes('stone', object.stone * rate));
		object.food && (this.xp += object.food * rate * 4, this.addRes('food', object.food * rate));
		object.points && (this.xp += object.points * rate * 4, this.addRes('points', object.points * rate));
		if (me.xp >= me.maxXP) {
			me.xp = 0;
			me.maxXP *= 1.2;
			me.onAge();
		}
	}
	onAge() {
		this.upgradePoints++;
		this.age++;
		this.gameServer.manager.playerAge(this.socket);
	}
	hitFrom(attacker) {
		var me = this;
		let ang = Math.atan2(this.y - attacker.player.y, this.x - attacker.player.x);
		let dmg = attacker.player.weapon.dmg * (attacker.player.hat && attacker.player.hat.dmgMultO || 1) * (attacker.player.tail && attacker.player.tail.dmgMultO || 1) * weaponVariants[attacker.player.weaponType].val;
		let ste;
		attacker.player.weapon.steal && (ste = Math.min(this.points || 0, attacker.player.weapon.steal), this.addRes('points', - ste), attacker.player.addRes('points', ste));
		this.updateHealth(-1 * dmg, attacker.player);
		let kbAmt = 0.3 * (attacker.player.weapon && attacker.player.weapon.knock || 1);
		if (this.hat) {
			this.hat.dmgK && (attacker.player.xVel -= this.hat.dmgK * Math.cos(ang), attacker.player.yVel -= this.hat.dmgK * Math.sin(ang));
			this.hat.dmg && attacker.player.updateHealth(-1 * dmg * this.hat.dmg, this);
		}
		this.tail && this.tail.dmg && attacker.player.updateHealth(-1 * dmg * this.tail.dmg, this);
		attacker.player.hat && attacker.player.hat.healD && attacker.player.updateHealth(dmg * 1 /*weapon type dmg or something idk but i think there is a mutiplier here*/ * attacker.player.hat.healD, attacker.player);
		attacker.player.tail && attacker.player.tail.healD && attacker.player.updateHealth(dmg * 1 /*weapon type dmg or something idk but i think there is a mutiplier here*/ * attacker.player.tail.healD, attacker.player);
		attacker.player.weaponType === 3 && !(this.hat && this.hat.poisonRes) && (this.weaponDot = { amt: 5, max: 5, applied: 0, doer: attacker.player });
		attacker.player.hat && attacker.player.hat.poisonDmg && !(this.hat && this.hat.poisonRes) && (this.weaponDot = { amt: 5, max: 6, applied: 0, doer: attacker.player })
		this.xVel += kbAmt * Math.cos(ang);
		this.yVel += kbAmt * Math.sin(ang);
	}
	get isDead() {
		return (this.health <= 0);
	}
	hasItem(id, isTail = !1) {
		return this[isTail ? 'tails' : 'hats'].hasOwnProperty(id) && this[isTail ? 'tails' : 'hats'][id];
	}
	addItem(item, isTail = !1) {
		this[isTail ? 'tails' : 'hats'][item.id] = 1;
	}
	equiptItem(item, isTail = !1) {
		this[isTail ? 'tail' : 'hat'] = item;
		this[isTail ? 'tailCode' : 'skinCode'] = item.id;
	}
	unequipt(isTail) {
		this[isTail ? 'tail' : 'hat'] = null;
		this[isTail ? 'tailCode' : 'skinCode'] = 0;
	}
	alertDeath() {
		this.socket.send("11");
		let oData = this.gameServer.objs.getObjsNear(this.socket,
			this.gameServer.config.updateRadius);
		for (var j = this.objsNear.length; j--;) {
			oData = oData.concat(this.objsNear[j].serialize());
		}
		this.objCache = oData;
	}
	resetPlayer(preserveStats) {
		this.health = 100;
		this.maxHealth = 100;
		this.alive = true;
		this.xVel = null;
		this.yVel = null;
		this.moveDir = null;
		this.dirLock = !1;
		this.autoAtk = !1;
		this.damage = 5;
		this.objCache = !1;
		this.updateFrames = 0;
		this.cachedItems = [];
		this.weaponDot = null;
		this.foodDot = null;
		this.lastMove = Date.now();
		this.invis = !1;
		this.life++;
		this.weaponExp = [0, 0];
		this.weaponType = 0;
		this.points = 1000;
		this.stone = 1000;
		this.wood = 1000;
		this.food = 1000;
		this.kills = 0;
		this.gatherRate = 1;
		this.angle = 0;
		this.age = 1;
		this.upgrAge = 2;
		this.xp = 0;
		this.maxXP = 300;
		this.xpIncrease = 60;
		this.items = [
			0, 3, 6, 10
		];
		this.weapons = [
			0
		];
		this.reloads = [0, 0];
		this.weaponCode = 0; // 0 == Default hammer
		this.weapon = Items.weapons[this.weaponCode];
		this.buildCode = -1; // -1 == No build item
		this.killLeader = 0;
		this.playersNear = [];
		this.objsNear = [];
		this.allNear = [];
		this.socket.send(SERVER.PLAYER_SET_ID, this.sid);
	}
	setWeapon(weapon) {
		var me = this;
		me.weapon = weapon;
		this.earnWeaponExp(0);
		//me.weapon.effect.call(me, me);
	}
	canBuild(item) {
		var me = this;
		return (
			me.stone >= item.costs.stone &&
			me.wood >= item.costs.wood &&
			me.food >= item.costs.food &&
			(item.place ? me.placeCounter[item.group.id] < item.group.limit : !0)
		) || this.gameServer.sandbox;
	}
	updateHealth(amount, doer, bypass) {
		if (amount > 0 && this.health >= this.maxHealth) return !1;
		amount < 0 && this.hat && !bypass && (amount *= this.hat.dmgMult || 1);
		amount < 0 && this.tail && !bypass && (amount *= this.tail.dmgMult || 1);
		this.health += amount;
		this.health > this.maxHealth && (amount -= this.health - this.maxHealth, this.health = this.maxHealth);
		this.health <= 0 && this.killedBy(doer);
		this.gameServer.manager.updateHealth(this.socket, amount);
		return !doer /*|| doer.canSee(this)*/ || doer.socket.send(SERVER.DAMAGED_TEST, this.x | 0, this.y | 0, Math.round(-amount), 1), !0
	}
	killedBy(killer) {
		killer && killer.alive && (killer.kills++, killer.addRes('points', ((killer.hat && killer.hat.goldSteal && this.points | 0) || (100 * this.age * (killer.hat && killer.hat.kScrM ? killer.hat.kScrM : 1) | 0))));
		killer && killer.updateMaterial('kills');
		this.alive = !1;
		this.alertDeath();
		killer && this.gameServer.manager.updateKillLeader(killer.kills, killer.socket);
		console.log(this.name + (!killer ? ' has died' : ' was killed by ' + killer.name));
	}
	updateMaterial(material) {
		this.gameServer.manager.updateStat(this.socket, material, this[material], true);
	}
	addRes(material, amount) {
		this[material] += amount;
		this.earnWeaponExp(amount);
		this.updateMaterial(material);
	}
	earnWeaponExp(amount) {
		let exp = (this.weaponExp[this.weapon.type] += amount);
		if (exp < 3000) return this.weaponType = 0;
		if (exp >= 12000) return this.weaponType = 3;
		else if (exp >= 7000) return this.weaponType = 2;
		return this.weaponType = 1;
	}
	useCurrentItem(dir) {
		var me = this;
		//if (++this.placedInOneFrame > 5) return this.socket.dc('lol');
		var item = Items.list[me.items[me.items.indexOf(me.buildCode)]];
		if (item && item.place) item.place(me, dir);
		me.gameServer.manager.updatePlacedItems(this.socket, item.group.id, this.placeCounter[item.group.id]);
		me.gameServer.manager.updateMaterials(me.socket);
	}
	applyDot() {
		//if(Date.now() - this.lastPing > 5000) this.socket.dc('a');
		if (!this.alive) return;
		let selfDotAmt = 0;
		this.foodDot && this.foodDot.applied < this.foodDot.max && (selfDotAmt = this.foodDot.amt, this.foodDot.applied++);
		this.hat && this.hat.healthRegen && (selfDotAmt += this.hat.healthRegen);
		this.tail && this.tail.healthRegen && (selfDotAmt += this.tail.healthRegen);
		selfDotAmt && this.updateHealth(selfDotAmt, this, !0);
		this.weaponDot && this.weaponDot.applied < this.weaponDot.max && (this.updateHealth(-this.weaponDot.amt, this.weaponDot.doer, !0), this.weaponDot.applied++);
	}
	constructor(socket, sid, gameServer) {
		this.placedInOneFrame = 0;
		var me = this;
		this.updateFrames = 0;
		// Enviroment based properties
		this.playersNear = [];
		this.objsNear = [];
		this.dataCache = null;
		this.angle = 0;
		this.x = -1;
		this.y = -1;
		this.objCache = !1;
		this.allNear = [];
		// Connection based properties
		this.sid = sid;
		this.id = Player.getId();
		this.socket = socket;
		this.connected = false;
		this.spawned = false;
		this.alive = false;
		this.gameServer = gameServer;
		this.noCooldown = !1;

		// Player statistics based properties
		this.health = 100;
		this.maxHealth = 100; // TODO: make this customizable
		this.name = "unknown";
		this.scale = 35; // default
		this.stone = 1000;
		this.wood = 1000;
		this.food = 1000;
		this.points = 1000; // Score is the same as gold
		this.gatherRate = 1;

		// Item based properties
		this.weaponCode = 0; // 0 == Default hammer
		this.weapon = Items.weapons[this.weaponCode];
		this.buildCode = -1; // -1 == No build item
		this.skinCode = 0; // 0 == No skin / hat
		this.hat = null;
		this.hats = {};
		this.tailCode = 0; // 0 == No skin / hat
		this.tail = null;
		this.tails = {};
		this.upgradePoints = 0;
		this.atMaxXP = !1;
		this.items = [ // Array of the player's items as IDs
			0, 3, 6, 10
		];
		this.weapons = [
			0
		];
		this.killLeader = 0;
		this.reloads = [0, 0];
		this.weaponType = 0;
		this.weaponExp = [0, 0];

		this.weaponDot = null;
		this.foodDot = null;
		// Movement based properties
		this.moveDir = null;
		this.xVel = null;
		this.yVel = null;
		this.spdMult = 1;
		this.dirLock = !1;
		// Clan based properties
		this.team = null;
		this.clan = null;
		this.joiningClan = false;
		this.isTribeOwner = 0;
		// PvP based properties
		this.attackDist = 10;
		this.xpGain = 1;
		this.autoAtk = false;
		this.attacking = false;
		this.hitObj = false;
		this.xp = 0;
		this.maxXP = 300;
		this.xpIncrease = 60;
		this.age = 1;
		this.upgrAge = 2;
		this.damage = 5;
		this.kills = 0;
		this.isAdmin = socket.admin ? 1 : 0;
		socket.send([SERVER.INIT_PLAYER], this.id);
		let teamsData = [];
		let tribes = Array.from(gameServer.clans.tribes);

		this.seen = {};
		this.seenObjs = {};
		this.placeCounter = new Array(14).fill(0);
		this.cachedItems = [];
		for (let i = tribes.length; i--;)teamsData.push(tribes[i][1].serialize());
		socket.send(SERVER.INIT_TRIBES, { teams: teamsData });
		this.tickInterval = setInterval(() => this.tick(), this.gameServer.config.tickInterval);
		this.cacheInterval = setInterval(() => this.updateItemCache(), 500);
		this.dotInterval = setInterval(() => this.applyDot(), 1000);
		this.pings = [];
		this.lastPing = Date.now();
		this.totalPings = 0;
		this.allowed = !1;
		this.lastMove = Date.now();
		this.invis = !1;
		this.skinColor = 0;
		this.life = 0;
		this.placed = [];
	}
}
Player.ID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-=[]{}.,<>';:/";
Player.ID_CHARS_LEN = Player.ID_CHARS.length; // The length of ID_CHARS doesn't need to be calculated more than once
Player.ID_LEN = 20;
module.exports = Player;
