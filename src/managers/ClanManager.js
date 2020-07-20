var Clan = require("../entities/Clan");

class ClanManager {
	clanExists(name) {
		return this.tribes.has(name);
	}
	add(clanName) {
		let clan = new Clan(clanName);
		this.tribes.set(clanName, clan);
		this.newestClan = clan;
	}
	remove(clanName) {
		this.tribes.delete(clanName);
		this.newestClan = Array.from(this.tribes.values()).pop();
	}
	getByName(name) {
		return this.tribes.get(name);
	}
	constructor(gameServer) {
		this.gameServer = gameServer;
		this.newestClan = null;
		this.tribes = new Map();
	}
}
module.exports = ClanManager;