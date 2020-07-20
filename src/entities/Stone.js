var GameObj = require('./GameObject');

class Stone extends GameObj {
	constructor(sid) {
		super(sid);
		this.type = 2;
		this.scale = this.realScale = [80, 85, 90][Math.random() * 3 | 0];
		this.stone = 1;
		this.allowedInWater = !0;
	}
}
module.exports = Stone;