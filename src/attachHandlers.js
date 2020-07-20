var MessageHandler = require('./managers/MessageHandler');
var Player = require('./entities/Player');
var log = require('./utils/Logger');
var Manager = require('./managers/PlayerManager');
var Leaderboard = require('./entities/Leaderboard');
var Utils = require('./utils/Utils');
var ClanManager = require('./managers/ClanManager');
var Minimap = require("./managers/MinimapManager");
var GameObjManager = require('./managers/GameObjManager');
var PhysicsEngine = require('./utils/PhysicsEngine');
var Store = require('./managers/Store');
const { CLIENT } = require('./utils/packetCodes');
const pingPacket = new Uint8Array([145, 162, 112, 112]);
module.exports = (myPlayer, socket) => {
	log.all('New connection accepted.');
	socket.closedSocket = () => {
		myPlayer.msgHandler.disconn.call(myPlayer, socket);
	};
	myPlayer.manager.add(socket);
	myPlayer.msgHandler.conn.call(myPlayer, socket);
	// Attach packet handlers
	socket['packet' + CLIENT.START] = function (data) {
		if (arguments.length > 1) return socket.dc('a');
		// Player spawn packet, the data is an object with one property
		myPlayer.msgHandler.spawn.call(myPlayer, socket, data);
	};
	socket['packet' + CLIENT.ANGLE] = function (data) {
		if (arguments.length > 1) return socket.dc('a');
		myPlayer.msgHandler.angle.call(myPlayer, socket, data);
	};
	socket['packet' + CLIENT.MOVE] = function (key, down) {
		if (arguments.length > 2) return socket.dc('a');
		myPlayer.msgHandler.move.call(myPlayer, socket, key, down);
	};
	socket['packet' + CLIENT.CHAT] = function (msg) {
		if (arguments.length > 1) return socket.dc('a');
		myPlayer.msgHandler.chat.call(myPlayer, socket, msg);
	};
	socket['packet' + CLIENT.CLAN_CREATE] = function (clanName) {
		if (arguments.length > 1) return socket.dc('a');
		myPlayer.msgHandler.clanCreate.call(myPlayer, socket, clanName);
	};
	socket['packet' + CLIENT.LEAVE_CLAN] = function () {
		if (arguments.length > 0) return socket.dc('a');
		myPlayer.msgHandler.clanLeave.call(myPlayer, socket);
	};
	socket['packet' + CLIENT.CLAN_REQ_JOIN] = function (sid) {
		if (arguments.length > 1) return socket.dc('a');
		myPlayer.msgHandler.clanJoin.call(myPlayer, socket, sid);
	};
	socket['packet' + CLIENT.CLAN_ACC_JOIN] = function (sid, join) {
		if (arguments.length > 2) return socket.dc('a');
		myPlayer.msgHandler.notificationResponse.call(myPlayer, socket, sid, join);
	};
	socket['packet' + CLIENT.CLAN_KICK] = function (sid) {
		if (arguments.length > 1) return socket.dc('a');
		myPlayer.msgHandler.clanKick.call(myPlayer, socket, sid);
	};
	socket['packet' + CLIENT.AUTO_ATK] = function (isDirLock) {
		if (arguments.length > 1) return socket.dc('a');
		myPlayer.msgHandler.autoAttack.call(myPlayer, socket, !isDirLock);
	};
	socket['packet' + CLIENT.ATTACK] = function (atk, buildDir) {
		if (arguments.length > 2) return socket.dc('a');
		myPlayer.msgHandler.attack.call(myPlayer, socket, atk, buildDir);
	};
	socket['packet' + CLIENT.ITEM_BUY] = function (isBuying, id, isTail) {
		if (arguments.length > 3) return socket.dc('a');
		myPlayer.msgHandler.attemptBuy.call(myPlayer, socket, isBuying, id, isTail);
	};
	socket['packet' + CLIENT.UPGRADE] = function (id, data) {
		if (arguments.length > 1) return socket.dc('a');
		myPlayer.msgHandler.doUpgrade.call(myPlayer, socket, id);
	};
	socket['packet' + CLIENT.SELECT_ITEM] = function (index, isWeapon, data) {
		if (arguments.length > 2) return socket.dc('a');
		myPlayer.msgHandler.select.call(myPlayer, socket, index, isWeapon);
	};

	socket['packet' + CLIENT.PING] = function () {
		if (arguments.length !== 0) return socket.dc('a');
		/*socket.player.pings.push(Date.now() - socket.player.lastPing);
		socket.player.lastPing = Date.now();
		socket.player.pings.length > 20 && socket.player.pings.shift();
		if(++socket.player.totalPings % 10 === 0){
		  let avg = 0;
		  for(let i = socket.player.pings.length; i--;) avg += socket.player.pings[i];
		  avg = avg/socket.player.pings.length;
		  if(avg > 3200 || avg < 2000) return (console.log(avg), socket.dc('a'));
		}*/
		socket._send(pingPacket, !0);
	};
	socket['packet' + CLIENT.NOTIFY_CLAN] = () => {

	};
	socket['packetrmd'] = () => { }
}