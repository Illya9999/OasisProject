const PACKET = require('../utils/packetCodes');
class MinimapManager {
	minimapTick() {
		var me = this;
		let c = Array.from(me.serv.clans.tribes);
		for (let i = c.length; i--;) {
			var mems = c[i][1].members;
			var data = [];
			for (let j = mems.length; j--;) {
				data.push(mems[j].player.x, mems[j].player.y);
			}
			for (let j = mems.length; j--;) {
				mems[j].send(PACKET.SERVER.MINIMAP_LOCATIONS, data)
			}
		}
	}
	constructor(gameServer) {
		this.serv = gameServer;
		var me = this;
		this.clock = setInterval(() => {
			me.minimapTick.call(me);
		}, me.serv.config.statUpdateSpeed);
	}
}
module.exports = MinimapManager;