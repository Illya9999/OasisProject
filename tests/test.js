var GameServer = require('../src/GameServer');
var gs = new GameServer({
	port: 3000,
	logLevel: 0,
	adminEnabled: !0,
	adminQuery: 'pw',
	adminPass: 'admin'
});
gs.start();
//process.on('error', console.log);
