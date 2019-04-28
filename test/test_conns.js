const si = require("systeminformation");
let ips = new Array();
si.networkConnections().then(conns => {
	conns.forEach(c => {
		if (ips.indexOf(c.peeraddress) !== -1) return;
		ips.push(c.peeraddress);
	});
	console.log(ips);
});
