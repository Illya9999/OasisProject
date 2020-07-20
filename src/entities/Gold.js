var GameObj = require('./GameObject');

class Gold extends GameObj {
	constructor(sid) {
		super(sid);
		this.type = 3;
		this.scale = this.realScale = 80;
		this.points = 50;
		this.allowedInWater = !0;
	}
}
module.exports = Gold;