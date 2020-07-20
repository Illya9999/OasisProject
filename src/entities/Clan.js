class Clan {
	removePlayer(player) {
		player.player.team = null;
		player.player.clan = null;
		this.members.splice(this.members.indexOf(player), 1);

	}
	isPlayerOwner(player) {
		return (player.player.sid === this.ownerID);
	}
	addPlayer(player) {
		this.owner === null && (this.owner = player, this.ownerID = player.player.sid, this.owner.player.isTribeOwner = 1); // Update clan owner
		player.player.team = this.name;
		player.player.clan = this;
		this.members.push(player);
	}
	serialize() {
		var me = this;
		// Turn the Clan object into a structure the client can use
		return {
			sid: me.name,
			ownerID: me.ownerID
		}
	}
	serializeMembers() {
		var ser = [];
		let members = this.members;
		for (let i = members.length; i--;) ser.push(members[i].player.sid, members[i].player.name);
		this.serializedMemberCache = ser;
		return this.serializedMemberCache;
	}
	constructor(name = null) {
		this.name = name;
		this.members = [];
		this.serializedMemberCache = [];
		this.owner = null;
		this.ownerID = null;
		this.joinQueue = [];
	}
}
module.exports = Clan;