class Collection extends Map {
	setAliases(value, aliases) {
		for (let i = aliases.length; i--;)this.set(aliases[i], value);
		return this;
	}
}

const Commands = new Collection();
const SetKeys = new Collection();
const ValueKeys = new Collection();

SetKeys.setAliases('points', ['money', 'gold', 'score', 'treasure', 'pts', 'points'])
	.setAliases('wood', ['wood', 'tree'])
	.setAliases('stone', ['rock', 'stone'])
	.setAliases('food', ['food'])
	.setAliases('kills', ['kills'])
	.setAliases('skinCode', ['hat', 'skincode'])
	.setAliases('tailCode', ['tail', 'accessory', 'access', 'acc', 'tailcode'])
	.setAliases('xp', ['exp', 'experience', 'xp'])
	.setAliases('age', ['level', 'lvl', 'age'])
	.setAliases('upgradePoints', ['upgrade', 'upgr', 'upgrpts', 'upgradepts', 'upgradepoints'])
	.setAliases('health', ['hp', 'life', 'health'])
	.setAliases('maxHealth', ['maxhp', 'maxlife', 'maxhealth'])
	.setAliases('weaponCode', ['heldweapon', 'weapon', 'weaponid', 'weaponcode'])
	.setAliases('buildCode', ['item', 'itemid', 'itemcode', 'itm', 'helditem', 'heldcode', 'build', 'buildid', 'buildcode'])
	.setAliases('spdMult', ['spd', 'spdmult', 'speed', 'speedmult']);

ValueKeys.setAliases(true, ['t', 'y', 'true'])
	.setAliases(false, ['f', 'n', 'false'])
	.setAliases(NaN, ['nan'])
	.setAliases(Infinity, ['inf', 'infinite', 'infinity'])
	.setAliases(undefined, ['undefined', 'void', 'nothing'])
	.setAliases(null, ['null']);

Commands.setAliases(function (player, userID, key = '', val) {
	if (isNaN(userID - 0)) [userID, key, val] = [player.sid, userID, key];
	key = key.toLowerCase();
	let targetPlayer = this.getBySID(userID);
	if (!targetPlayer || !SetKeys.has(key)) return !1;
	try {
		val = JSON.parse(val);
	} catch (error) {
		if (ValueKeys.has(val.toLowerCase())) val = ValueKeys.get(val.toLowerCase());
		else val = 0;
	}
	targetPlayer.player[SetKeys.get(key)] = val;
	return !0;
}, ['set', 's'])
	.setAliases(function (player, mode) {
		mode = mode.toLowerCase();
		if (!SetKeys.has(mode)) return !1;
		this.gameServer.leaderboard.mode = SetKeys.get(mode);
		return !0;
	}, ['lb', 'leaderboard', 'lbmode', 'scoreboard', 'score', 'sort', 'sortmode'])
	.setAliases(function (player, userID = 'a', reason = 'no reason') {
		if (isNaN(userID - 0)) return !1;
		userID = userID - 0;
		let targetPlayer = this.getBySID(userID);
		if (!targetPlayer) return !1;
		this.close(targetPlayer, `Kicked: ${reason}`);
		return !0;
	}, ['kick', 'k'])
	.setAliases(function (player, msg = '') {
		this.broadcast(msg);
	}, ['ann', 'announce', 'a', 'broadcast']);

module.exports = Commands;