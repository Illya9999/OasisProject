var GameObj = require("./GameObject");
class PlayerObject extends GameObj {
	constructor(sid, owner, x, y, dir = 0) {
		super(sid);
		owner.player && (owner = owner.player);
		this.owner = owner;
		this.x = x;
		this.y = y;
		this.dir = dir;
		this.data = 1;
		this.scale = 100;
		this.ownerSID = owner.sid;
		this.noGather = !0;
		this.objManager = owner.gameServer.objs;
	}
	static place(owner) {
		owner.wood -= this.costs.wood;
		owner.stone -= this.costs.stone;
		owner.food -= this.costs.food;
		owner.placeCounter[this.group.id]++;
	}
	destroy(destroyer, bypass) {
		this.owner[this.group.id]--;
		this.objManager.removeObject(this.sid);
		//if(bypass) return;
		//this.owner.placed.splice(this.owner.placed.indexOf(this), 1);

		//destroyer.broadcast("12", this.sid);
		this.costs.wood && destroyer.player.addRes("wood", this.costs.wood);
		this.costs.stone && destroyer.player.addRes("stone", this.costs.stone);
		this.costs.food && destroyer.player.addRes("food", this.costs.food);
	}
}

module.exports = PlayerObject;
