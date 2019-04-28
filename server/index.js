const WebSocket = require('ws');
const si = require('systeminformation');

const AutoWhitelist = require('./security/auto-whitelist.class.js');

const autoWhitelist = new AutoWhitelist();

const wss = new WebSocket.Server({port: 8000});

wss.on('connection', async (ws, req) => {
	// Check that remote is in the active connections whitelist
	const isActive = await autoWhitelist.check(req.connection.remoteAddress).catch(error => {
		ws.close(400, error.message);
	});

	if (isActive === false) {
		ws.close(403, 'Access denied');
		return;
	}

	if (ws.readyState !== 1) {
		return;
	}

	ws.on('message', msg => {
		console.log(msg);
		ws.send('Got: ' + msg);

		const data = JSON.parse(msg);
		console.log('request data:', data);

		if (typeof data.type === 'string' && typeof data.args === 'object') {
			si[data.type].apply(null, data.args).then(res => {
				ws.send(JSON.stringify(res, 0, ' '));
				console.log('fn feedback:', res);
			}).catch(error => {
				ws.send(JSON.stringify(new Error(error), 0, ' '));
				console.log('fn feedback:', error);
			});
		}
	});
});

console.log(`eDEX-UI Remote Server listening at ${(typeof wss.address() === 'string') ? wss.address : wss.address().address + ':' + wss.address().port}`);
