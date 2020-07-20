var GameObj = require('./GameObject');

class Tree extends GameObj {
	constructor(sid) {
		super(sid);
		this.type = 0;
		this.scale = [150, 160, 165, 175][Math.random() * 4 | 0];
		this.wood = 1;
		this.realScale = this.scale * 0.6;
		this.allowedInDesert = !1;
	}
}
module.exports = Tree;