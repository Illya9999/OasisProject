var GameObj = require('./GameObject');

class Bush extends GameObj {
	setCords(x, y) {
		super.setCords(x, y);
		if (this.y > 14400 - 2400) this.dmg = 35;
		else this.dmg = 0;
	}
	constructor(sid) {
		super(sid);
		this.type = 1;
		this.scale = [80, 85, 95][Math.random() * 3 | 0];
		this.food = 1;
		this.realScale = this.scale * 0.6;
	}
}
module.exports = Bush;