var shop = require('../utils/shopItems');

class Store {
	canBuyItem(socket, item) {
		return (socket.player.points >= item.price || global.gameServer.sandbox);
	}
	getItemById(id, isTail = !1) {
		var me = this;
		return me[isTail ? 'tails' : 'hats'].hasOwnProperty(id) ? me[isTail ? 'tails' : 'hats'][id] : null;
	}
	constructor(serv) {
		var me = this;
		this.serv = serv;
		this.items = shop.items;
		this.hats = {};
		this.tails = {};
		for (var p in me.items.hats) {
			if (me.items.hats.hasOwnProperty(p)) {
				me.hats[me.items.hats[p].id] = me.items.hats[p]
			}
		}
		for (var p in me.items.tails) {
			if (me.items.tails.hasOwnProperty(p)) {
				me.tails[me.items.tails[p].id] = me.items.tails[p]
			}
		}
	}
}
module.exports = Store;
