const WebSocket = require("ws");
const ipaddr = require("ipaddr.js");
const si = require("systeminformation");

var ipWhitelist = new Array();

function updateIPwhitelist() {
    si.networkConnections().then(conns => {
        conns.forEach(c => {
            let ip = c.peeraddress
            if (c.state !== "ESTABLISHED" || ip === "0.0.0.0" || ip === "127.0.0.1" || ip === "::") return;
            if (ipWhitelist.indexOf(ip) === -1) ipWhitelist.push(ip);
        });
        // TODO: remove before release
        ipWhitelist.push("127.0.0.1");
    });
}
setInterval(updateIPwhitelist, 1500);

const wss = new WebSocket.Server({ port: 8000 });

wss.on("connection", (ws, req) => {

    // Get & parse remote IP address
    let ip = ipaddr.parse(req.connection.remoteAddress);
    if (ip.kind() === "ipv6") {
        ip.isIPv4MappedAddress() ? ip = ip.toIPv4Address() : ws.close(400, "Could not parse IPv6 address");
    }
    ip = ip.toString();
    if (ip.length < 7) ws.close(400, "Detected IP address is too short");

    if (ws.readyState !== 1) return;

    // Check that remote is in the active connections whitelist
    if (ipWhitelist.indexOf(ip) !== -1) {
        console.log(ip, "in whitelist");
    } else {
        console.log(ip, "unlisted");
    }

    if (ws.readyState !== 1) return;

    console.log(ip, "ACCEPTED");
    ws.on("message", msg => {
        console.log(msg);
        ws.send("Got: "+msg);

        let data = JSON.parse(msg);
        console.log("request data: ", data);

        if (typeof data.type === "string" && typeof data.args === "object") {
            si[data.type].apply(null, data.args).then(res => {
                ws.send(JSON.stringify(res, 0, " "));
                console.log("fn feedback: ", res);
            }).catch(e => {
                ws.send(JSON.stringify(new Error(e), 0, " "));
                console.log("fn feedback: ", e);
            });
        }
    });
});

console.log(`eDEX-UI Remote Server listening at ${(typeof wss.address() === "string") ? wss.address : wss.address().address+":"+wss.address().port}`);
