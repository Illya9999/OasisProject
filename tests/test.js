var GameServer = require('../src/GameServer');
var gs = new GameServer({
	port: 3000,
	logLevel: 0
});
gs.start();
//process.on('error', console.log);
