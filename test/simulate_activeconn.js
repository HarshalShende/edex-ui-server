const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8002 });

wss.on("connection", (ws, req) => {
	console.log(req.connection.remoteAddress, "connected");
});
