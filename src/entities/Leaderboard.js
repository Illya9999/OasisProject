const { SERVER } = require('../utils/packetCodes');
class Leaderboard {
	sortPlayers() {
		let players = this.gameServer.manager.realPlayers.slice().filter(e => e.player.alive).sort((a, b) => {
			return b.player[this.mode] - a.player[this.mode];
		});
		return players;
	}
	getTopPlayers(a) {
		var len = this.gameServer.config.leaderboardCount;
		if (this.gameServer.manager.realPlayers.length < this.gameServer.config.leaderboardCount)
			len = this.gameServer.manager.realPlayers.length;
		return a.slice(0, len);
	}
	serializePlayer(p) {
		return [
			p.player.sid,
			p.player.name,
			p.player[this.mode],
		];
	}
	updateLeaderboard() {
		var me = this;
		var lb = me.getTopPlayers(me.sortPlayers());
		if (lb[0] == void 0) return;
		var data = [];
		for (var i = 0; i < lb.length; ++i) {
			data = data.concat(me.serializePlayer(lb[i]));
		}
		// Broadcast leaderboard data
		me.gameServer.io.send(SERVER.LEADERBOAD, data);
	}
	constructor(gameServer, mode = 'points') {
		this.mode = mode;
		this.gameServer = gameServer;
		var me = this;
		this.clock = setInterval(() => {
			me.updateLeaderboard.call(me);
		}, me.gameServer.config.statUpdateSpeed);
	}
}
module.exports = Leaderboard;